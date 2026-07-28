import type { GraphQLSchema } from 'graphql';
import { createSchema as createYogaSchema } from 'graphql-yoga';
import { describe, expect, it } from 'vitest';

import { createApiApp } from '../../app/create-api-app';
import type { ApiEnv } from '../../app/api-env.type';
import type { ApiRequestContext } from '../../context/api-request-context.interface';
import { TestLogger } from '../../testing/test-logger';
import { mountGraphql } from './mount-graphql';

type GraphqlContext = { shared: ApiRequestContext };

describe('mountGraphql', () => {
  it('executes queries with shared context', async () => {
    const schema = createSchema();
    const app = createApiApp<ApiEnv>({
      serviceName: 'test',
      logger: new TestLogger(),
    });
    mountGraphql<ApiEnv, GraphqlContext>(app, {
      schema,
      createContext: (shared) => ({ shared }),
    });
    const response = await app.request('/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'graphql-request',
      },
      body: JSON.stringify({ query: '{ requestId }' }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { requestId: 'graphql-request' },
    });
    expect(response.body).toBeInstanceOf(ReadableStream);
  });

  it('masks resolver errors', async () => {
    const logger = new TestLogger();
    const app = createApiApp<ApiEnv>({
      serviceName: 'test',
      logger,
    });
    mountGraphql<ApiEnv, GraphqlContext>(app, {
      schema: createSchema(),
      createContext: (shared) => ({ shared }),
      maskErrors: true,
    });
    const response = await app.request('/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ failure }' }),
    });
    expect(await response.text()).not.toContain('private resolver detail');
    expect(
      logger.records.some(
        (record) => record.event === 'api.graphql.request.failed',
      ),
    ).toBe(true);
  });
});

function createSchema(): GraphQLSchema {
  return createYogaSchema<GraphqlContext>({
    typeDefs: /* GraphQL */ `
      type Query {
        requestId: String!
        failure: String
      }
    `,
    resolvers: {
      Query: {
        requestId: (_source, _args, context) => context.shared.requestId,
        failure: () => {
          throw new Error('private resolver detail');
        },
      },
    },
  });
}
