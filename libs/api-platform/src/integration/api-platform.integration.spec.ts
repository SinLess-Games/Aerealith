import { initTRPC } from '@trpc/server';
import { createSchema } from 'graphql-yoga';
import { describe, expect, it } from 'vitest';

import type { ApiEnv } from '../app/api-env.type';
import { createApiApp } from '../app/create-api-app';
import type { ApiRequestContext } from '../context/api-request-context.interface';
import { InMemoryWebSocketAdapter } from '../testing/in-memory-websocket.adapter';
import { TestLogger } from '../testing/test-logger';
import { mountGraphql } from '../transports/graphql';
import { mountHttpRoutes } from '../transports/http';
import { mountTrpc } from '../transports/trpc';
import { mountWebSocketRoutes } from '../transports/websocket';

describe('API platform integration', () => {
  it('hosts HTTP, tRPC, GraphQL, and WebSocket routes together', async () => {
    const app = createApiApp<ApiEnv>({
      serviceName: 'example',
      logger: new TestLogger(),
    });
    mountHttpRoutes(app, {
      basePath: '/api/v1',
      register: (router) => {
        router.get('/health', (context) => context.json({ status: 'ok' }));
      },
    });

    const trpc = initTRPC.context<ApiRequestContext>().create();
    mountTrpc(app, {
      path: '/trpc',
      router: trpc.router({
        example: trpc.router({
          ping: trpc.procedure.mutation(() => 'pong'),
        }),
      }),
      createContext: (shared) => shared,
    });

    mountGraphql(app, {
      path: '/graphql',
      schema: createSchema({
        typeDefs: 'type Query { ping: String! }',
        resolvers: { Query: { ping: () => 'pong' } },
      }),
      createContext: (shared) => ({ shared }),
    });

    const webSockets = new InMemoryWebSocketAdapter<ApiEnv>();
    mountWebSocketRoutes(app, {
      adapter: webSockets,
      routes: [
        {
          path: '/ws/example',
          onMessage: () => undefined,
        },
      ],
    });

    expect((await app.request('/api/v1/health')).status).toBe(200);
    expect(
      (
        await app.request('/trpc/example.ping', {
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
          body: JSON.stringify({ query: '{ ping }' }),
        })
      ).status,
    ).toBe(200);
    expect((await app.request('/ws/example')).status).toBe(426);
  });
});
