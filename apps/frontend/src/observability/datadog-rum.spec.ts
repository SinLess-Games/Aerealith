import { beforeEach, describe, expect, it, vi } from 'vitest';

const datadog = vi.hoisted(() => ({
  init: vi.fn(),
  startSessionReplayRecording: vi.fn(),
  stopSessionReplayRecording: vi.fn(),
  startView: vi.fn(),
  addError: vi.fn(),
}));

vi.mock('@datadog/browser-rum', () => ({ datadogRum: datadog }));

import {
  initializeDatadogRum,
  resetDatadogForTests,
  setDatadogSessionReplayAllowed,
} from './datadog-rum';

describe('Datadog RUM', () => {
  beforeEach(() => {
    resetDatadogForTests();
    vi.clearAllMocks();
  });

  it('stays disabled when configuration is incomplete', async () => {
    await expect(initializeDatadogRum()).resolves.toBe(false);
    expect(datadog.init).not.toHaveBeenCalled();
  });

  it('does not start replay before RUM is initialized', () => {
    setDatadogSessionReplayAllowed(true);
    expect(datadog.startSessionReplayRecording).not.toHaveBeenCalled();
  });
});
