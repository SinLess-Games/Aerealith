import { test, expect } from '../../fixtures/auth.fixture';
import { graphql, trpcMutation } from '../../helpers/api';

const LoginMutation = `
  mutation Login($input: LoginInput!) {
    login(input: $input) { id }
  }
`;

test.describe('sensitive-operation rate limiting', () => {
  test('shares login quota across HTTP, GraphQL, and tRPC while safe operations stay free', async ({
    auth,
  }) => {
    const request = await auth.newRequestContext({ ip: '203.0.113.200' });
    const credentials = {
      usernameOrEmail: `missing_${Date.now()}@e2e.aerealith.invalid`,
      password: 'GeneratedOnly1Password',
    };
    try {
      for (let index = 0; index < 10; index += 1) {
        if (index > 0) {
          expect((await request.get('/health')).status()).toBe(200);
          expect((await request.get('/api/V1/flags')).status()).toBe(200);
          const safeGraphql = await graphql(request, '{ me { id } }');
          expect(safeGraphql.status()).toBe(200);
        }

        const transport = index % 3;
        if (transport === 0) {
          expect(
            (
              await request.post('/api/V1/auth/login', {
                data: credentials,
              })
            ).status(),
          ).toBe(401);
        } else if (transport === 1) {
          const response = await graphql(request, LoginMutation, {
            input: credentials,
          });
          expect(response.status()).toBe(401);
          const body = (await response.json()) as { errors?: unknown[] };
          expect(body.errors?.length).toBeGreaterThan(0);
        } else {
          const response = await trpcMutation(
            request,
            'auth.login',
            credentials,
          );
          expect(response.status()).toBe(401);
        }
      }

      const limited = await request.post('/api/V1/auth/login', {
        data: credentials,
      });
      expect(limited.status()).toBe(429);
      expect(limited.headers()['retry-after']).toBe('60');
      const body = (await limited.json()) as { error: { code: string } };
      expect(body.error.code).toBe('RATE_LIMITED');
    } finally {
      await request.dispose();
    }
  });
});
