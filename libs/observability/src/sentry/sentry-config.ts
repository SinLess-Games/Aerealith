/** Values used to initialize Sentry without exposing the wider SDK to callers. */
export interface SentryConfig {
  readonly service: string;
  readonly dsn?: string;
  readonly enabled?: boolean;
  readonly environment?: string;
  readonly release?: string;
  readonly tracesSampleRate?: number;
}

/** Distinguishes disabled configuration from an already initialized SDK. */
export interface SentryInitializationResult {
  readonly enabled: boolean;
  readonly initialized: boolean;
}
