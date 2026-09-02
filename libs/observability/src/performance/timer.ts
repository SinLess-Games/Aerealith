/** Supplies a small monotonic timer abstraction for telemetry measurements. */
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
      // Capture the first end time only, making repeated cleanup calls safe and
      // ensuring every consumer sees the same final duration.
      endedAt ??= now();
      return endedAt - startedAt;
    },
  };
}
