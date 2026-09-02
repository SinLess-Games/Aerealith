/** Public OpenTelemetry configuration and span-handle contracts. */
import type {
  Attributes,
  AttributeValue,
  Span,
  SpanOptions,
  Tracer,
} from '@opentelemetry/api';

/** Selects the tracer source and service identity for shared tracing helpers. */
export interface TracingConfiguration {
  readonly enabled?: boolean;
  readonly service: string;
  readonly version?: string;
  readonly tracer?: Tracer;
}

/** Span options with an explicitly typed attributes collection. */
export interface SpanConfiguration extends SpanOptions {
  readonly attributes?: Attributes;
}

/** Minimal IDs propagated into logs and async observability context. */
export interface TraceContext {
  readonly traceId?: string;
  readonly spanId?: string;
}

/** Safe manual-span facade for callback/event-driven integrations. */
export interface SpanHandle {
  readonly span: Span | undefined;
  readonly traceId?: string;
  readonly spanId?: string;
  setAttribute(name: string, value: AttributeValue): void;
  recordException(error: unknown): void;
  run<T>(operation: () => T): T;
  end(): void;
}
