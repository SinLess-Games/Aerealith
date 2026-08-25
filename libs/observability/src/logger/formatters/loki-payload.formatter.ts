// libs/observability/src/logger/formatters/loki-payload.formatter.ts

import type { LogRecord } from '@aerealith-ai/core';

import type { LokiLabels } from '../config/loki-logger-options.interface';

/**
 * One Loki log entry.
 *
 * Loki requires the timestamp to be represented as a string containing Unix
 * epoch nanoseconds.
 */
export type LokiValue = readonly [timestampNanoseconds: string, line: string];

/**
 * One Loki stream containing a label set and its associated log entries.
 */
export interface LokiStream {
  readonly stream: Readonly<Record<string, string>>;
  readonly values: readonly LokiValue[];
}

/**
 * Payload accepted by Loki's `/loki/api/v1/push` endpoint.
 */
export interface LokiPushPayload {
  readonly streams: readonly LokiStream[];
}

/**
 * Converts finalized Aerealith log records into a Grafana Loki push payload.
 *
 * Records are grouped by their low-cardinality stream labels. High-cardinality
 * information remains inside each serialized JSON log line.
 */
export class LokiPayloadFormatter {
  private readonly labels: LokiLabels;

  public constructor(labels: LokiLabels = {}) {
    this.labels = normalizeLabels(labels);
  }

  /**
   * Formats one or more log records into a Loki push payload.
   */
  public format(records: readonly LogRecord[]): LokiPushPayload {
    const streams = new Map<string, MutableLokiStream>();

    for (const record of records) {
      const streamLabels = this.createStreamLabels(record);
      const streamKey = createStreamKey(streamLabels);
      const value = createLokiValue(record);
      const existingStream = streams.get(streamKey);

      if (existingStream === undefined) {
        streams.set(streamKey, {
          stream: streamLabels,
          values: [value],
        });

        continue;
      }

      existingStream.values.push(value);
    }

    return {
      streams: Array.from(streams.values()).map((stream) => ({
        stream: stream.stream,
        values: stream.values,
      })),
    };
  }

  private createStreamLabels(
    record: LogRecord,
  ): Readonly<Record<string, string>> {
    return normalizeLabels({
      service: record.service,
      environment: record.environment,
      level: record.level,
      ...this.labels,
    });
  }
}

interface MutableLokiStream {
  readonly stream: Readonly<Record<string, string>>;
  readonly values: LokiValue[];
}

function createLokiValue(record: LogRecord): LokiValue {
  return [toUnixNanoseconds(record.timestamp), JSON.stringify(record)];
}

function toUnixNanoseconds(timestamp: string): string {
  const milliseconds = Date.parse(timestamp);

  if (!Number.isFinite(milliseconds)) {
    return currentUnixNanoseconds();
  }

  return (BigInt(Math.trunc(milliseconds)) * 1_000_000n).toString();
}

function currentUnixNanoseconds(): string {
  return (BigInt(Date.now()) * 1_000_000n).toString();
}

function normalizeLabels(
  labels: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  const normalized: Record<string, string> = {};

  const entries = Object.entries(labels).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  for (const [rawKey, rawValue] of entries) {
    const key = normalizeLabelName(rawKey);
    const value = rawValue.trim();

    if (key.length === 0 || value.length === 0) {
      continue;
    }

    normalized[key] = value;
  }

  return normalized;
}

function normalizeLabelName(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return '';
  }

  let normalized = trimmed.replaceAll(/\W/gu, '_');

  if (!/^[a-zA-Z_]/u.test(normalized)) {
    normalized = `_${normalized}`;
  }

  return normalized;
}

function createStreamKey(labels: Readonly<Record<string, string>>): string {
  return Object.entries(labels)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join('|');
}
