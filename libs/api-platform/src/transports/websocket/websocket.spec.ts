import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';

import type { ApiEnv } from '../../app/api-env.type';
import { createTestApiContext } from '../../testing/create-test-api-context';
import { InMemoryWebSocketAdapter } from '../../testing/in-memory-websocket.adapter';

describe('InMemoryWebSocketAdapter', () => {
  it('registers, validates, dispatches, and closes connections', async () => {
    const onMessage = vi.fn();
    const onClose = vi.fn();
    const adapter = new InMemoryWebSocketAdapter<ApiEnv>();
    const app = { get: vi.fn() } as never;
    adapter.register(app, {
      path: '/ws/example',
      schema: z.object({ value: z.string() }),
      onMessage,
      onClose,
    });
    const context = createTestApiContext();
    const connection = await adapter.connect('/ws/example', context);
    await connection.receive(
      JSON.stringify({
        version: 1,
        type: 'example',
        payload: { value: 'ok' },
      }),
    );
    expect(onMessage).toHaveBeenCalledOnce();
    connection.close(1000, 'done');
    expect(connection.closed).toEqual({ code: 1000, reason: 'done' });
  });

  it('returns safe error envelopes for invalid JSON and schema failures', async () => {
    const adapter = new InMemoryWebSocketAdapter<ApiEnv>();
    adapter.register({ get: vi.fn() } as never, {
      path: '/ws/example',
      schema: z.object({ value: z.string() }),
      onMessage: vi.fn(),
    });
    const connection = await adapter.connect(
      '/ws/example',
      createTestApiContext(),
    );
    await connection.receive('{invalid');
    await connection.receive(
      JSON.stringify({ version: 1, type: 'example', payload: { value: 1 } }),
    );
    expect(connection.sent).toHaveLength(2);
    expect(connection.sent[0]).toMatchObject({
      type: 'error',
      error: { code: 'BAD_REQUEST' },
    });
    expect(connection.sent[1]).toMatchObject({
      type: 'error',
      error: { code: 'VALIDATION_FAILED' },
    });
  });

  it('rejects unauthorized connections', async () => {
    const adapter = new InMemoryWebSocketAdapter<ApiEnv>();
    adapter.register({ get: vi.fn() } as never, {
      path: '/ws/private',
      authorize: () => false,
      onMessage: vi.fn(),
    });
    await expect(
      adapter.connect('/ws/private', createTestApiContext()),
    ).rejects.toThrow('authentication rejected');
  });

  it('supports application-level heartbeat messages', async () => {
    const adapter = new InMemoryWebSocketAdapter<ApiEnv>();
    adapter.register({ get: vi.fn() } as never, {
      path: '/ws/heartbeat',
      heartbeat: {},
      onMessage: vi.fn(),
    });
    const connection = await adapter.connect(
      '/ws/heartbeat',
      createTestApiContext(),
    );
    await connection.receive(
      JSON.stringify({
        version: 1,
        type: 'ping',
        id: 'heartbeat-1',
        payload: null,
      }),
    );
    expect(connection.sent).toEqual([
      {
        version: 1,
        type: 'pong',
        id: 'heartbeat-1',
        payload: null,
      },
    ]);
  });
});
