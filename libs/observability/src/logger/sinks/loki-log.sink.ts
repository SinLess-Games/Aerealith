// libs/observability/src/logger/sinks/loki-log.sink.ts

import type { LogRecord, LogSink } from '@aerealith-ai/core';

import type { LokiLoggerOptions } from '../config/loki-logger-options.interface';
import { LokiPayloadFormatter } from '../formatters/loki-payload.formatter';

const LOKI_PUSH_PATH = '/loki/api/v1/push';

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_MAX_BATCH_BYTES = 1_048_576;
const DEFAULT_FLUSH_INTERVAL_MS = 5_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 500;
const DEFAULT_MAX_RETRY_DELAY_MS = 10_000;
const DEFAULT_MAX_BUFFER_SIZE = 10_000;

const HTTP_REQUEST_TIMEOUT = 408;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVER_ERROR = 500;

const DEFAULT_JITTER_FACTOR = 0.75;
const MINIMUM_JITTER_FACTOR = 0.5;
const JITTER_FACTOR_RANGE = 0.5;
const MAXIMUM_UINT32 = 0xffffffff;

const textEncoder = new TextEncoder();

/**
 * Fetch-compatible function accepted by the Loki sink.
 *
 * Tests may inject a custom implementation without replacing global fetch.
 */
export type LokiFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

interface BufferedLogRecord {
  readonly record: LogRecord;
  readonly estimatedBytes: number;
}

interface LokiRequestBody {
  readonly body: BodyInit;
  readonly compressed: boolean;
}

/**
 * Buffers finalized log records and exports them to Grafana Loki.
 *
 * Failed batches are returned to the front of the buffer so a later flush can
 * retry them. The buffer is bounded to prevent logging failures from consuming
 * unlimited memory.
 */
export class LokiLogSink implements LogSink {
  public readonly name = 'loki';

  private readonly enabled: boolean;
  private readonly endpoint: string;
  private readonly headers: Headers;
  private readonly formatter: LokiPayloadFormatter;
  private readonly fetchImplementation: LokiFetch;
  private readonly batchSize: number;
  private readonly maxBatchBytes: number;
  private readonly requestTimeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly maxRetryDelayMs: number;
  private readonly maxBufferSize: number;
  private readonly compression: boolean;

  private readonly buffer: BufferedLogRecord[] = [];

  private bufferBytes = 0;
  private flushTimer: ReturnType<typeof setInterval> | undefined;
  private flushPromise: Promise<void> | undefined;
  private backgroundFlush: Promise<void> | undefined;
  private closePromise: Promise<void> | undefined;
  private closing = false;
  private closed = false;

  public constructor(
    options: LokiLoggerOptions,
    fetchImplementation: LokiFetch = globalThis.fetch.bind(globalThis),
  ) {
    this.enabled = options.enabled ?? true;
    this.endpoint = normalizeEndpoint(options.endpoint);
    this.headers = createHeaders(options);
    this.formatter = new LokiPayloadFormatter(options.labels);
    this.fetchImplementation = fetchImplementation;

    this.batchSize = resolvePositiveInteger(
      options.batchSize,
      DEFAULT_BATCH_SIZE,
    );
    this.maxBatchBytes = resolvePositiveInteger(
      options.maxBatchBytes,
      DEFAULT_MAX_BATCH_BYTES,
    );
    this.requestTimeoutMs = resolvePositiveInteger(
      options.requestTimeoutMs,
      DEFAULT_REQUEST_TIMEOUT_MS,
    );
    this.maxRetries = resolveNonNegativeInteger(
      options.maxRetries,
      DEFAULT_MAX_RETRIES,
    );
    this.retryDelayMs = resolvePositiveInteger(
      options.retryDelayMs,
      DEFAULT_RETRY_DELAY_MS,
    );
    this.maxRetryDelayMs = resolvePositiveInteger(
      options.maxRetryDelayMs,
      DEFAULT_MAX_RETRY_DELAY_MS,
    );
    this.maxBufferSize = resolvePositiveInteger(
      options.maxBufferSize,
      DEFAULT_MAX_BUFFER_SIZE,
    );
    this.compression = options.compression ?? false;

    if (this.enabled) {
      const flushIntervalMs = resolvePositiveInteger(
        options.flushIntervalMs,
        DEFAULT_FLUSH_INTERVAL_MS,
      );

      this.startFlushTimer(flushIntervalMs);
    }
  }

  /**
   * Adds a finalized record to the Loki buffer.
   *
   * This operation does not wait for a network request.
   */
  public write(record: LogRecord): void {
    if (!this.enabled || this.closing || this.closed) {
      return;
    }

    const bufferedRecord = createBufferedRecord(record);

    this.buffer.push(bufferedRecord);
    this.bufferBytes += bufferedRecord.estimatedBytes;

    this.enforceBufferLimit();

    if (
      this.buffer.length >= this.batchSize ||
      this.bufferBytes >= this.maxBatchBytes
    ) {
      this.startBackgroundFlush();
    }
  }

  /**
   * Exports all currently buffered records.
   *
   * Concurrent calls share the same in-progress flush operation.
   */
  public flush(): Promise<void> {
    if (!this.enabled || this.closed || this.buffer.length === 0) {
      return Promise.resolve();
    }

    if (this.flushPromise !== undefined) {
      return this.flushPromise;
    }

    const operation = this.drainBuffer();

    this.flushPromise = operation.then(
      () => {
        this.flushPromise = undefined;
      },
      (error: unknown) => {
        this.flushPromise = undefined;

        throw error;
      },
    );

    return this.flushPromise;
  }

  /**
   * Stops periodic flushing, exports remaining records, and prevents further
   * writes.
   *
   * Calling this method more than once is safe.
   */
  public close(): Promise<void> {
    if (this.closed) {
      return Promise.resolve();
    }

    if (this.closePromise !== undefined) {
      return this.closePromise;
    }

    this.closing = true;
    this.stopFlushTimer();

    this.closePromise = this.flush().then(
      () => {
        this.closed = true;
      },
      (error: unknown) => {
        this.closed = true;

        throw error;
      },
    );

    return this.closePromise;
  }

  private async drainBuffer(): Promise<void> {
    while (this.buffer.length > 0) {
      const batch = this.takeBatch();

      try {
        await this.sendWithRetry(batch.map(({ record }) => record));
      } catch (error) {
        this.restoreBatch(batch);

        throw error;
      }
    }
  }

  private takeBatch(): BufferedLogRecord[] {
    let count = 0;
    let batchBytes = 0;

    for (const bufferedRecord of this.buffer) {
      if (count >= this.batchSize) {
        break;
      }

      const nextBatchBytes = batchBytes + bufferedRecord.estimatedBytes;

      if (count > 0 && nextBatchBytes > this.maxBatchBytes) {
        break;
      }

      batchBytes = nextBatchBytes;
      count += 1;
    }

    const batch = this.buffer.splice(0, Math.max(count, 1));

    for (const bufferedRecord of batch) {
      this.bufferBytes -= bufferedRecord.estimatedBytes;
    }

    this.bufferBytes = Math.max(this.bufferBytes, 0);

    return batch;
  }

  private restoreBatch(batch: readonly BufferedLogRecord[]): void {
    this.buffer.unshift(...batch);

    for (const bufferedRecord of batch) {
      this.bufferBytes += bufferedRecord.estimatedBytes;
    }

    this.enforceBufferLimit();
  }

  private enforceBufferLimit(): void {
    const excessRecordCount = this.buffer.length - this.maxBufferSize;

    if (excessRecordCount <= 0) {
      return;
    }

    const droppedRecords = this.buffer.splice(0, excessRecordCount);

    for (const droppedRecord of droppedRecords) {
      this.bufferBytes -= droppedRecord.estimatedBytes;
    }

    this.bufferBytes = Math.max(this.bufferBytes, 0);
  }

  private async sendWithRetry(records: readonly LogRecord[]): Promise<void> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        await this.send(records);

        return;
      } catch (error) {
        if (attempt >= this.maxRetries || !isRetryableFailure(error)) {
          throw error;
        }

        await delay(this.calculateRetryDelay(attempt));
        attempt += 1;
      }
    }
  }

  private async send(records: readonly LogRecord[]): Promise<void> {
    const serializedPayload = JSON.stringify(this.formatter.format(records));
    const requestBody = await this.createRequestBody(serializedPayload);
    const headers = new Headers(this.headers);

    headers.set('Content-Type', 'application/json');

    if (requestBody.compressed) {
      headers.set('Content-Encoding', 'gzip');
    } else {
      headers.delete('Content-Encoding');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await this.fetchImplementation(this.endpoint, {
        method: 'POST',
        headers,
        body: requestBody.body,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new LokiHttpError(response.status, response.statusText);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  private async createRequestBody(payload: string): Promise<LokiRequestBody> {
    if (!this.compression || typeof CompressionStream !== 'function') {
      return {
        body: payload,
        compressed: false,
      };
    }

    const source = new Blob([payload]).stream();
    const compressedStream = source.pipeThrough(new CompressionStream('gzip'));
    const compressedBody = await new Response(compressedStream).arrayBuffer();

    return {
      body: compressedBody,
      compressed: true,
    };
  }

  private calculateRetryDelay(attempt: number): number {
    const exponentialDelay = this.retryDelayMs * Math.pow(2, attempt);
    const cappedDelay = Math.min(exponentialDelay, this.maxRetryDelayMs);
    const jitterFactor =
      MINIMUM_JITTER_FACTOR +
      createSecureRandomFraction() * JITTER_FACTOR_RANGE;

    return Math.max(1, Math.round(cappedDelay * jitterFactor));
  }

  private startFlushTimer(flushIntervalMs: number): void {
    this.flushTimer = setInterval(() => {
      this.startBackgroundFlush();
    }, flushIntervalMs);

    unrefTimer(this.flushTimer);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer === undefined) {
      return;
    }

    clearInterval(this.flushTimer);
    this.flushTimer = undefined;
  }

  private startBackgroundFlush(): void {
    if (
      this.backgroundFlush !== undefined ||
      this.buffer.length === 0 ||
      this.closing ||
      this.closed
    ) {
      return;
    }

    const operation = this.flush();

    this.backgroundFlush = operation.then(
      () => {
        this.backgroundFlush = undefined;
      },
      () => {
        this.backgroundFlush = undefined;
      },
    );
  }
}

class LokiHttpError extends Error {
  public readonly status: number;

  public constructor(status: number, statusText: string) {
    const description =
      statusText.trim().length === 0
        ? `HTTP ${status}`
        : `HTTP ${status}: ${statusText}`;

    super(`Loki push request failed with ${description}`);

    this.name = 'LokiHttpError';
    this.status = status;
  }
}

function createBufferedRecord(record: LogRecord): BufferedLogRecord {
  return {
    record,
    estimatedBytes: textEncoder.encode(JSON.stringify(record)).byteLength,
  };
}

function normalizeEndpoint(endpoint: string): string {
  const normalized = endpoint.trim();

  if (normalized.length === 0) {
    throw new Error('A Loki endpoint is required');
  }

  const withoutTrailingSlashes = trimTrailingSlashes(normalized);

  if (withoutTrailingSlashes.endsWith(LOKI_PUSH_PATH)) {
    return withoutTrailingSlashes;
  }

  return `${withoutTrailingSlashes}${LOKI_PUSH_PATH}`;
}

function trimTrailingSlashes(value: string): string {
  let end = value.length;

  while (end > 0 && value.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return end === value.length ? value : value.slice(0, end);
}

function createHeaders(options: LokiLoggerOptions): Headers {
  const headers = new Headers(options.headers);

  if (
    options.tenantId !== undefined &&
    options.tenantId.trim().length > 0 &&
    !headers.has('X-Scope-OrgID')
  ) {
    headers.set('X-Scope-OrgID', options.tenantId.trim());
  }

  return headers;
}

function isRetryableFailure(error: unknown): boolean {
  if (error instanceof LokiHttpError) {
    return (
      error.status === HTTP_REQUEST_TIMEOUT ||
      error.status === HTTP_TOO_MANY_REQUESTS ||
      error.status >= HTTP_SERVER_ERROR
    );
  }

  return true;
}

function resolvePositiveInteger(
  value: number | undefined,
  fallback: number,
): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.max(1, Math.trunc(value));
}

function resolveNonNegativeInteger(
  value: number | undefined,
  fallback: number,
): number {
  if (value === undefined || !Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return Math.max(0, Math.trunc(value));
}

function createSecureRandomFraction(): number {
  const runtimeCrypto = globalThis.crypto;

  if (
    runtimeCrypto === undefined ||
    typeof runtimeCrypto.getRandomValues !== 'function'
  ) {
    return DEFAULT_JITTER_FACTOR;
  }

  const values = new Uint32Array(1);

  runtimeCrypto.getRandomValues(values);

  const value = values[0];

  if (value === undefined) {
    return DEFAULT_JITTER_FACTOR;
  }

  return value / MAXIMUM_UINT32;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

interface UnrefTimer {
  unref(): void;
}

function unrefTimer(timer: unknown): void {
  if (!isUnrefTimer(timer)) {
    return;
  }

  timer.unref();
}

function isUnrefTimer(value: unknown): value is UnrefTimer {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return 'unref' in value && typeof value.unref === 'function';
}
