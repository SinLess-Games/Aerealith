import type { RunStatus } from './contracts';

const transitions: Readonly<Record<RunStatus, readonly RunStatus[]>> = {
  accepted: ['planning', 'cancelled', 'failed'],
  planning: ['queued', 'running', 'cancelled', 'failed'],
  queued: ['running', 'cancelled', 'failed'],
  running: ['succeeded', 'cancelled', 'failed'],
  succeeded: [],
  failed: [],
  cancelled: [],
};

export class InvalidRunTransitionError extends Error {
  constructor(from: RunStatus, to: RunStatus) {
    super(`Invalid AI run status transition: ${from} -> ${to}.`);
    this.name = 'InvalidRunTransitionError';
  }
}

export function isTerminalRunStatus(status: RunStatus): boolean {
  return transitions[status].length === 0;
}

export function canTransitionRunStatus(
  from: RunStatus,
  to: RunStatus,
): boolean {
  return from === to || transitions[from].includes(to);
}

export function assertRunStatusTransition(
  from: RunStatus,
  to: RunStatus,
): void {
  if (!canTransitionRunStatus(from, to)) {
    throw new InvalidRunTransitionError(from, to);
  }
}
