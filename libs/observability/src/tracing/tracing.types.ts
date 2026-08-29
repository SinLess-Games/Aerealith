import type {
  Attributes,
  AttributeValue,
  Span,
  SpanOptions,
  Tracer,
} from '@opentelemetry/api';

export interface TracingConfiguration {
  readonly enabled?: boolean;
  readonly service: string;
  readonly version?: string;
  readonly tracer?: Tracer;
}

export interface SpanConfiguration extends SpanOptions {
  readonly attributes?: Attributes;
}

export interface TraceContext {
  readonly traceId?: string;
  readonly spanId?: string;
}

export interface SpanHandle {
  readonly span: Span | undefined;
  readonly traceId?: string;
  readonly spanId?: string;
  setAttribute(name: string, value: AttributeValue): void;
  recordException(error: unknown): void;
  run<T>(operation: () => T): T;
  end(): void;
}
