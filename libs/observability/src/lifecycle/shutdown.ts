/** Provides a bounded, idempotent shutdown path for telemetry resources. */
import { normalizeError, type NormalizedError } from '../errors';

/** Normalized failure from one named shutdown handler. */
export interface ShutdownFailure {
  readonly name: string;
  readonly error: NormalizedError;
}

/** Aggregate outcome returned after handlers finish or the deadline wins. */
export interface ShutdownResult {
  readonly timedOut: boolean;
  readonly failures: readonly ShutdownFailure[];
}

/** A subsystem cleanup callback may be synchronous or asynchronous. */
export type ObservabilityShutdownHandler = () => void | Promise<void>;

// Map keys prevent duplicate subsystem handlers; the cached promise guarantees
// multiple signal handlers cannot run shutdown more than once.
const shutdownHandlers = new Map<string, ObservabilityShutdownHandler>();
let shutdownPromise: Promise<ShutdownResult> | undefined;

export function registerObservabilityShutdownHandler(
  name: string,
  handler: ObservabilityShutdownHandler,
): () => void {
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error('A shutdown handler name is required.');
  shutdownHandlers.set(normalizedName, handler);
  // Owners can unregister resources that are replaced during process lifetime.
  return () => shutdownHandlers.delete(normalizedName);
}

/** Flushes all initialized observability subsystems once, within a deadline. */
export function shutdownObservability(
  timeoutMs = 5_000,
): Promise<ShutdownResult> {
  shutdownPromise ??= runShutdown(normalizeTimeout(timeoutMs));
  return shutdownPromise;
}

/** Clears process globals so shutdown tests remain isolated. */
export function resetObservabilityShutdownForTesting(): void {
  shutdownHandlers.clear();
  shutdownPromise = undefined;
}

async function runShutdown(timeoutMs: number): Promise<ShutdownResult> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<ShutdownResult>((resolve) => {
    timeout = setTimeout(
      () => resolve({ timedOut: true, failures: [] }),
      timeoutMs,
    );
  });

  const shutdown = Promise.allSettled(
    [...shutdownHandlers.entries()].map(async ([name, handler]) => {
      try {
        await handler();
        return undefined;
      } catch (error) {
        // One exporter failure must not prevent the remaining exporters from
        // flushing, so failures are returned as data rather than rethrown.
        return { name, error: normalizeError(error) } satisfies ShutdownFailure;
      }
    }),
  ).then((results): ShutdownResult => ({
    timedOut: false,
    failures: results.flatMap((result) =>
      result.status === 'fulfilled' && result.value !== undefined
        ? [result.value]
        : [],
    ),
  }));

  // Whichever finishes first defines the caller-visible result.
  const result = await Promise.race([shutdown, deadline]);
  if (timeout !== undefined) clearTimeout(timeout);
  return result;
}

function normalizeTimeout(timeoutMs: number): number {
  // Invalid deadlines fall back to a bounded five seconds.
  return Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 5_000;
}
