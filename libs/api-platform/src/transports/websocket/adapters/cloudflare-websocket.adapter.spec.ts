import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiEnv } from '../../../app/api-env.type';
import { createApiApp } from '../../../app/create-api-app';
import { TestLogger } from '../../../testing/test-logger';
import { createCloudflareWebSocketAdapter } from './cloudflare-websocket.adapter';

const websocketState = vi.hoisted(() => ({
  events: undefined as
    | {
        onMessage?: (event: MessageEvent, socket: unknown) => Promise<void>;
        onClose?: (event: CloseEvent, socket: unknown) => Promise<void>;
        onError?: (event: Event, socket: unknown) => Promise<void>;
      }
    | undefined,
  upgrade: vi.fn(),
}));

vi.mock('hono/cloudflare-workers', () => ({
  upgradeWebSocket: websocketState.upgrade.mockImplementation(
    async (_context: unknown, events: typeof websocketState.events) => {
      websocketState.events = events;
      return new Response(null, { status: 200 });
    },
  ),
}));

describe('createCloudflareWebSocketAdapter', () => {
  beforeEach(() => {
    websocketState.events = undefined;
    websocketState.upgrade.mockClear();
  });

  it('rejects unauthorized upgrades with a standard envelope', async () => {
    const app = createApiApp<ApiEnv>({
      serviceName: 'websocket',
      logger: new TestLogger(),
    });
    createCloudflareWebSocketAdapter<ApiEnv>().register(app, {
      path: '/private',
      authorize: () => false,
      onMessage: vi.fn(),
    });

    const response = await app.request('/private', {
      headers: { 'x-request-id': 'request-1' },
    });
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'WebSocket authentication required.',
        requestId: 'request-1',
      },
    });
    expect(websocketState.upgrade).not.toHaveBeenCalled();
  });

  it('adapts messages and connection lifecycle callbacks', async () => {
    const logger = new TestLogger();
    const onMessage = vi.fn();
    const onClose = vi.fn();
    const onError = vi.fn();
    const app = createApiApp<ApiEnv>({
      serviceName: 'websocket',
      logger,
    });
    createCloudflareWebSocketAdapter<ApiEnv>().register(app, {
      path: '/socket',
      onMessage,
      onClose,
      onError,
    });

    expect((await app.request('/socket')).status).toBe(200);
    const events = websocketState.events;
    expect(events).toBeDefined();

    const socket = {
      send: vi.fn(),
      close: vi.fn(),
    };
    const envelope = JSON.stringify({
      version: 1,
      type: 'example',
      payload: { value: 'ok' },
    });
    await events?.onMessage?.({ data: envelope } as MessageEvent, socket);
    await events?.onMessage?.(
      { data: new Blob([envelope]) } as MessageEvent,
      socket,
    );
    await events?.onMessage?.(
      { data: new TextEncoder().encode(envelope).buffer } as MessageEvent,
      socket,
    );
    const shared = new SharedArrayBuffer(
      new TextEncoder().encode(envelope).byteLength,
    );
    new Uint8Array(shared).set(new TextEncoder().encode(envelope));
    await events?.onMessage?.({ data: shared } as MessageEvent, socket);
    expect(onMessage).toHaveBeenCalledTimes(4);

    await events?.onClose?.(
      { code: 1000, reason: 'done' } as CloseEvent,
      socket,
    );
    expect(onClose).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String) }),
      expect.objectContaining({ requestId: expect.any(String) }),
      1000,
      'done',
    );

    const failure = new Event('error');
    await events?.onError?.(failure, socket);
    expect(onError).toHaveBeenCalledWith(
      failure,
      expect.objectContaining({ id: expect.any(String) }),
      expect.objectContaining({ requestId: expect.any(String) }),
    );
    expect(socket.close).toHaveBeenCalledWith(1011, 'Connection error');
    expect(logger.records.map((record) => record.event)).toEqual(
      expect.arrayContaining([
        'api.websocket.connection.opened',
        'api.websocket.connection.closed',
        'api.websocket.connection.failed',
      ]),
    );
  });
});
