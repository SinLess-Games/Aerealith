// libs/observability/src/logger/config/loki-logger-options.interface.ts

/**
 * Static Loki stream labels applied to every exported log record.
 *
 * Labels must remain low-cardinality. Values such as request IDs, user IDs,
 * trace IDs, session IDs, and resource IDs belong in the structured record
 * body rather than in Loki labels.
 */
export type LokiLabels = Readonly<Record<string, string>>;

/**
 * Additional HTTP headers sent with Loki push requests.
 *
 * This may include authorization headers supplied by the deployment
 * environment. Header values must never be included in application logs.
 */
export type LokiHeaders = Readonly<Record<string, string>>;

/**
 * Configuration for the Grafana Loki logging sink.
 */
export interface LokiLoggerOptions {
  /**
   * Enables exporting log records to Loki.
   *
   * @default false
   */
  readonly enabled?: boolean;

  /**
   * Base Loki URL or complete push endpoint.
   *
   * Accepted examples:
   * - http://localhost:3100
   * - https://logs.example.com
   * - https://logs.example.com/loki/api/v1/push
   */
  readonly endpoint: string;

  /**
   * Static low-cardinality labels applied to every Loki stream.
   *
   * The sink may add standard labels such as `service`, `environment`, and
   * `level` when they are not already supplied.
   */
  readonly labels?: LokiLabels;

  /**
   * Additional headers included with every Loki request.
   *
   * Examples:
   * - Authorization
   * - X-Scope-OrgID
   *
   * Secrets should be loaded from environment or secret-management systems
   * rather than committed to source control.
   */
  readonly headers?: LokiHeaders;

  /**
   * Grafana Loki tenant identifier.
   *
   * When provided, the sink sends this value using the `X-Scope-OrgID`
   * request header unless that header already exists in `headers`.
   */
  readonly tenantId?: string;

  /**
   * Maximum number of records placed in one Loki push request.
   *
   * @default 100
   */
  readonly batchSize?: number;

  /**
   * Maximum approximate serialized size of one Loki push request in bytes.
   *
   * The sink should flush the current batch before this limit is exceeded.
   *
   * @default 1048576
   */
  readonly maxBatchBytes?: number;

  /**
   * Maximum time records may remain buffered before being exported.
   *
   * @default 5000
   */
  readonly flushIntervalMs?: number;

  /**
   * Maximum time allowed for one Loki HTTP request.
   *
   * @default 10000
   */
  readonly requestTimeoutMs?: number;

  /**
   * Maximum number of retry attempts after the initial request fails.
   *
   * A value of `0` disables retries.
   *
   * @default 3
   */
  readonly maxRetries?: number;

  /**
   * Initial delay before retrying a failed request.
   *
   * Implementations should apply exponential backoff and jitter to subsequent
   * retry attempts.
   *
   * @default 500
   */
  readonly retryDelayMs?: number;

  /**
   * Maximum retry delay after exponential backoff is applied.
   *
   * @default 10000
   */
  readonly maxRetryDelayMs?: number;

  /**
   * Maximum number of records retained in memory while Loki is unavailable.
   *
   * When this limit is reached, the oldest buffered records should be dropped
   * so logging cannot consume unbounded memory.
   *
   * @default 10000
   */
  readonly maxBufferSize?: number;

  /**
   * Compresses Loki request bodies when the runtime supports compression.
   *
   * @default false
   */
  readonly compression?: boolean;
}
