export interface SentryConfig {
  readonly service: string;
  readonly dsn?: string;
  readonly enabled?: boolean;
  readonly environment?: string;
  readonly release?: string;
  readonly tracesSampleRate?: number;
}

export interface SentryInitializationResult {
  readonly enabled: boolean;
  readonly initialized: boolean;
}
