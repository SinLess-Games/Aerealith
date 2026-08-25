import { describe, expect, it } from 'vitest';

import { LazyAuthorizationService } from './lazy-authorization.service';

describe('LazyAuthorizationService self-service policy', () => {
  it.each([
    'account.read',
    'account.update',
    'sessions.read',
    'sessions.revoke',
    'sessions.revoke_all',
  ])(
    'allows %s only on the authenticated user resource',
    async (permission) => {
      const authorization = new LazyAuthorizationService();

      await expect(
        authorization.can({
          principal: { id: 'user-1', type: 'user' },
          permission,
          scope: { type: 'resource', id: 'user-1' },
        }),
      ).resolves.toMatchObject({
        allowed: true,
        principalId: 'user-1',
        permission,
        reason: 'permission_granted',
      });
    },
  );
});
