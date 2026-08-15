import { test, expect } from '../../fixtures/auth.fixture';
import { graphql, trpcMutation, trpcQuery } from '../../helpers/api';

test.describe('authentication transport parity', () => {
  test('accepts the same normal-user session through HTTP, GraphQL, and tRPC', async ({
    auth,
  }) => {
    const user = await auth.users.create();
    const request = await auth.loginRequest(user);
    try {
      expect((await request.get('/api/V1/users/me')).status()).toBe(200);

      const graphqlResponse = await graphql(
        request,
        '{ me { id username emailVerified } }',
      );
      expect(graphqlResponse.status()).toBe(200);
      const graphqlBody = (await graphqlResponse.json()) as {
        data: { me: { id: string; username: string } };
      };
      expect(graphqlBody.data.me).toMatchObject({
        id: user.id,
        username: user.username,
      });

      const trpcResponse = await trpcQuery(request, 'auth.me');
      expect(trpcResponse.status()).toBe(200);
      const trpcBody = (await trpcResponse.json()) as {
        result: { data: { id: string; username: string } };
      };
      expect(trpcBody.result.data).toMatchObject({
        id: user.id,
        username: user.username,
      });
    } finally {
      await request.dispose();
    }
  });

  test('keeps each transport unauthenticated without a session', async ({
    auth,
  }) => {
    const request = await auth.newRequestContext();
    try {
      expect((await request.get('/api/V1/users/me')).status()).toBe(401);

      const graphqlResponse = await graphql(request, '{ me { id } }');
      expect(graphqlResponse.status()).toBe(200);
      await expect(graphqlResponse.json()).resolves.toMatchObject({
        data: { me: null },
      });

      expect((await trpcQuery(request, 'auth.me')).status()).toBe(401);
    } finally {
      await request.dispose();
    }
  });

  test('revokes an HTTP-created session through GraphQL and tRPC logout', async ({
    auth,
  }) => {
    const user = await auth.users.create();

    const graphqlSession = await auth.loginRequest(user);
    try {
      const logout = await graphql(graphqlSession, 'mutation { logout }');
      expect(logout.status()).toBe(200);
      expect((await graphqlSession.get('/api/V1/auth/me')).status()).toBe(401);
    } finally {
      await graphqlSession.dispose();
    }

    const trpcSession = await auth.loginRequest(user);
    try {
      const logout = await trpcMutation(trpcSession, 'auth.logout', {});
      expect(logout.status()).toBe(200);
      expect((await trpcSession.get('/api/V1/auth/me')).status()).toBe(401);
    } finally {
      await trpcSession.dispose();
    }
  });

  test('does not expose alternate GraphQL or tRPC admin operations', async ({
    auth,
  }) => {
    const user = await auth.users.create();
    const request = await auth.loginRequest(user);
    try {
      expect((await request.get('/api/V1/admin/overview')).status()).toBe(403);

      const schema = await graphql(
        request,
        '{ __schema { queryType { fields { name } } mutationType { fields { name } } } }',
      );
      const body = (await schema.json()) as {
        data: {
          __schema: {
            queryType: { fields: Array<{ name: string }> };
            mutationType: { fields: Array<{ name: string }> };
          };
        };
      };
      const fields = [
        ...body.data.__schema.queryType.fields,
        ...body.data.__schema.mutationType.fields,
      ].map(({ name }) => name);
      expect(
        fields.some((field) => /admin|role|permission/iu.test(field)),
      ).toBe(false);
      expect((await trpcQuery(request, 'admin.overview')).status()).toBe(404);
    } finally {
      await request.dispose();
    }
  });
});
