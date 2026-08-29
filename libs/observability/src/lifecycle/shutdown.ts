import { normalizeError, type NormalizedError } from '../errors';

export interface ShutdownFailure {
  readonly name: string;
  readonly error: NormalizedError;
}

export interface ShutdownResult {
  readonly timedOut: boolean;
  readonly failures: readonly ShutdownFailure[];
}

export type ObservabilityShutdownHandler = () => void | Promise<void>;

const shutdownHandlers = new Map<string, ObservabilityShutdownHandler>();
let shutdownPromise: Promise<ShutdownResult> | undefined;

export function registerObservabilityShutdownHandler(
  name: string,
  handler: ObservabilityShutdownHandler,
): () => void {
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error('A shutdown handler name is required.');
  shutdownHandlers.set(normalizedName, handler);
  return () => shutdownHandlers.delete(normalizedName);
}

/** Flushes all initialized observability subsystems once, within a deadline. */
export function shutdownObservability(
  timeoutMs = 5_000,
): Promise<ShutdownResult> {
  shutdownPromise ??= runShutdown(normalizeTimeout(timeoutMs));
  return shutdownPromise;
}

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

  const result = await Promise.race([shutdown, deadline]);
  if (timeout !== undefined) clearTimeout(timeout);
  return result;
}

function normalizeTimeout(timeoutMs: number): number {
  return Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 5_000;
}
