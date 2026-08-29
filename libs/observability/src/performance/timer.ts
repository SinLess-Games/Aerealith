export interface PerformanceTimer {
  readonly startedAt: number;
  elapsed(): number;
  end(): number;
}

/** Starts an idempotent high-resolution duration timer. */
export function startTimer(
  now: () => number = () => performance.now(),
): PerformanceTimer {
  const startedAt = now();
  let endedAt: number | undefined;

  return {
    startedAt,
    elapsed: () => (endedAt ?? now()) - startedAt,
    end: () => {
      endedAt ??= now();
      return endedAt - startedAt;
    },
  };
}
