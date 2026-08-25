import { initTRPC } from '@trpc/server';
import { describe, expect, it } from 'vitest';

import { createApiApp } from '../../app/create-api-app';
import type { ApiEnv } from '../../app/api-env.type';
import type { ApiRequestContext } from '../../context/api-request-context.interface';
import { TestLogger } from '../../testing/test-logger';
import { mountTrpc } from './mount-trpc';

describe('mountTrpc', () => {
  it('mounts a router and propagates shared context', async () => {
    const trpc = initTRPC.context<ApiRequestContext>().create();
    const router = trpc.router({
      example: trpc.router({
        ping: trpc.procedure.mutation(({ ctx }) => ({
          requestId: ctx.requestId,
        })),
      }),
    });
    const app = createApiApp<ApiEnv>({
      serviceName: 'test',
      logger: new TestLogger(),
    });
    mountTrpc(app, {
      router,
      path: '/trpc',
      createContext: (shared) => shared,
    });

    const response = await app.request('/trpc/example.ping', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'trpc-request',
      },
      body: JSON.stringify({ json: null }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      result: { data: { requestId: 'trpc-request' } },
    });
  });

  it('does not expose internal errors', async () => {
    const trpc = initTRPC.context<ApiRequestContext>().create();
    const router = trpc.router({
      fail: trpc.procedure.mutation(() => {
        throw new Error('database password leaked');
      }),
    });
    const app = createApiApp<ApiEnv>({
      serviceName: 'test',
      logger: new TestLogger(),
    });
    mountTrpc(app, {
      router,
      createContext: (shared) => shared,
    });
    const response = await app.request('/trpc/fail', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: null }),
    });
    const text = await response.text();
    expect(response.status).toBe(500);
    expect(text).not.toContain('database password leaked');
  });
});
