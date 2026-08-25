import { initTRPC } from '@trpc/server';
import { createSchema } from 'graphql-yoga';
import { describe, expect, it, vi } from 'vitest';

import type { ApiEnv } from '../app/api-env.type';
import { createApiApp } from '../app/create-api-app';
import type { ApiRequestContext } from '../context/api-request-context.interface';
import { InMemoryWebSocketAdapter } from '../testing/in-memory-websocket.adapter';
import { TestLogger } from '../testing/test-logger';
import type { ApiModule } from './api-module.interface';
import { registerApiModules } from './register-api-modules';

describe('registerApiModules', () => {
  it('registers every optional transport and modules with no transports', async () => {
    const app = createApiApp<ApiEnv>({
      serviceName: 'modules',
      logger: new TestLogger(),
    });
    const trpc = initTRPC.context<ApiRequestContext>().create();
    const sockets = new InMemoryWebSocketAdapter<ApiEnv>();
    const onMessage = vi.fn();
    const modules: ApiModule<ApiEnv>[] = [
      { name: 'empty' },
      {
        name: 'complete',
        httpBasePath: '/api',
        registerHttp(router) {
          router.get('/status', (context) => context.json({ ok: true }));
        },
        trpc: {
          path: '/trpc',
          router: trpc.router({
            ping: trpc.procedure.mutation(() => 'pong'),
          }),
          createContext: (shared) => shared,
        },
        graphql: {
          path: '/graphql',
          schema: createSchema({
            typeDefs: 'type Query { status: String! }',
            resolvers: { Query: { status: () => 'ok' } },
          }),
          createContext: (shared) => ({ shared }),
        },
        webSockets: {
          adapter: sockets,
          routes: [{ path: '/ws', onMessage }],
        },
      },
    ];

    expect(registerApiModules(app, modules)).toBe(app);
    expect((await app.request('/api/status')).status).toBe(200);
    expect(
      (
        await app.request('/trpc/ping', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ json: null }),
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await app.request('/graphql', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ query: '{ status }' }),
        })
      ).status,
    ).toBe(200);
    expect((await app.request('/ws')).status).toBe(426);
  });
});
