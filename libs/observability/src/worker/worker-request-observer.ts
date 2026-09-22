export interface WorkerAnalyticsDataPoint {
  readonly indexes?: readonly string[];
  readonly blobs?: readonly string[];
  readonly doubles?: readonly number[];
}

export interface WorkerAnalyticsDataset {
  writeDataPoint(dataPoint: WorkerAnalyticsDataPoint): void;
}

export interface WorkerRequestObservation {
  readonly service: string;
  readonly request: Request;
  readonly route?: string;
  readonly analytics?: WorkerAnalyticsDataset;
  readonly requestId?: string;
}

export interface WorkerRequestOutcome extends WorkerRequestObservation {
  readonly status: number;
  readonly durationMs: number;
  readonly error?: unknown;
}

/**
 * Records privacy-conscious, low-cardinality Worker request logs and metrics.
 *
 * Cloudflare Workers Observability supplies platform traces and invocation
 * metrics; this helper adds Aerealith-specific request rate, status, latency,
 * and failure dimensions through structured logs + Analytics Engine.
 */
export function recordWorkerRequest(outcome: WorkerRequestOutcome): void {
  const url = new URL(outcome.request.url);
  const route = normalizeWorkerRoute(outcome.route ?? url.pathname);
  const requestId =
    outcome.requestId ??
    outcome.request.headers.get('x-request-id') ??
    crypto.randomUUID();
  const method = outcome.request.method.toUpperCase();
  const failed = outcome.status >= 500 || outcome.error !== undefined;

  const event = {
    event: failed ? 'worker.request.failed' : 'worker.request.completed',
    service: outcome.service,
    method,
    route,
    status: outcome.status,
    durationMs: roundMetric(outcome.durationMs),
    requestId,
    cfRay: outcome.request.headers.get('cf-ray') ?? undefined,
    errorType: outcome.error ? errorName(outcome.error) : undefined,
  };

  if (failed) {
    console.error(JSON.stringify(event));
  } else {
    console.info(JSON.stringify(event));
  }

  outcome.analytics?.writeDataPoint({
    indexes: [outcome.service],
    blobs: [
      'http_request',
      method,
      route,
      String(outcome.status),
      failed ? 'error' : 'ok',
    ],
    doubles: [1, outcome.durationMs, failed ? 1 : 0],
  });
}

export function normalizeWorkerRoute(route: string): string {
  return route
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/giu,
      '/:id',
    )
    .replace(/\/\d+(?=\/|$)/gu, '/:id');
}

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}

function errorName(error: unknown): string {
  return error instanceof Error && error.name ? error.name : 'UnknownError';
}
