export interface ApiRequestObservation {
  readonly service: string;
  readonly requestId: string;
  readonly method: string;
  readonly route: string;
  readonly startedAt: Date;
}

export interface ApiRequestOutcome extends ApiRequestObservation {
  readonly durationMs: number;
  readonly status: number;
}

export interface ApiRequestObserver {
  requestStarted(observation: ApiRequestObservation): {
    readonly traceId?: string;
    readonly spanId?: string;
  } | void;
  requestCompleted(outcome: ApiRequestOutcome): void;
  requestFailed(outcome: ApiRequestOutcome, error: unknown): void;
}
