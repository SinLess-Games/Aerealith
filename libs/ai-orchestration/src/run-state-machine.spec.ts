import {
  assertRunStatusTransition,
  canTransitionRunStatus,
  InvalidRunTransitionError,
  isTerminalRunStatus,
} from './run-state-machine';

describe('AI run state machine', () => {
  it('allows the normal durable orchestration lifecycle', () => {
    expect(canTransitionRunStatus('accepted', 'planning')).toBe(true);
    expect(canTransitionRunStatus('planning', 'queued')).toBe(true);
    expect(canTransitionRunStatus('queued', 'running')).toBe(true);
    expect(canTransitionRunStatus('running', 'succeeded')).toBe(true);
  });

  it('allows cancellation before completion', () => {
    expect(canTransitionRunStatus('accepted', 'cancelled')).toBe(true);
    expect(canTransitionRunStatus('planning', 'cancelled')).toBe(true);
    expect(canTransitionRunStatus('queued', 'cancelled')).toBe(true);
    expect(canTransitionRunStatus('running', 'cancelled')).toBe(true);
  });

  it('rejects transitions out of terminal states', () => {
    expect(isTerminalRunStatus('succeeded')).toBe(true);
    expect(isTerminalRunStatus('failed')).toBe(true);
    expect(isTerminalRunStatus('cancelled')).toBe(true);

    expect(() =>
      assertRunStatusTransition('succeeded', 'running'),
    ).toThrow(InvalidRunTransitionError);
  });

  it('treats idempotent state writes as valid', () => {
    expect(canTransitionRunStatus('queued', 'queued')).toBe(true);
  });
});
