/** Verifies Discord span names and attributes remain stable and bounded. */
import { startSpan, withSpan } from '@aerealith-ai/observability';

import { startDiscordTrace, withDiscordTrace } from './traces.adapter';

jest.mock('@aerealith-ai/observability', () => {
  const handle = {
    span: undefined,
    setAttribute: jest.fn(),
    recordException: jest.fn(),
    run: jest.fn((operation: () => unknown) => operation()),
    end: jest.fn(),
  };

  return {
    withSpan: jest.fn((_name: string, execute: () => unknown) => execute()),
    startSpan: jest.fn(() => handle),
    __spanHandle: handle,
  };
});

const spanHandle = (
  jest.requireMock('@aerealith-ai/observability') as {
    __spanHandle: object;
  }
).__spanHandle;

describe('Discord trace adapter', () => {
  it('normalizes wrapper span names and omits undefined attributes', () => {
    expect(
      withDiscordTrace(' Gateway Handle ', () => 'result', {
        'Event Name': 'READY',
        missing: undefined,
      }),
    ).toBe('result');

    expect(withSpan).toHaveBeenCalledWith(
      'discord.gateway_handle',
      expect.any(Function),
      { attributes: { 'discord.event_name': 'READY' } },
    );
  });

  it('starts manual spans with normalized fallback names and attributes', () => {
    expect(startDiscordTrace('   ', { '': true })).toBe(spanHandle);

    expect(startSpan).toHaveBeenCalledWith('discord.unknown', {
      attributes: { 'discord.attribute': true },
    });
  });
});
