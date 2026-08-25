import { describe, expect, it } from 'vitest';

import { LocalAuthorizationService } from './local-authorization.service';

describe('LocalAuthorizationService', () => {
  const authorization = new LocalAuthorizationService();

  it('allows a local user to read only their own account', async () => {
    await expect(
      authorization.can({
        principal: { id: 'user-1', type: 'user' },
        permission: 'account.read',
        scope: { type: 'resource', id: 'user-1' },
      }),
    ).resolves.toMatchObject({ allowed: true });

    await expect(
      authorization.can({
        principal: { id: 'user-1', type: 'user' },
        permission: 'account.read',
        scope: { type: 'resource', id: 'user-2' },
      }),
    ).resolves.toMatchObject({ allowed: false });
  });

  it('does not grant administrator permissions in local development', async () => {
    await expect(
      authorization.can({
        principal: { id: 'user-1', type: 'user' },
        permission: 'users.read',
        scope: { type: 'global' },
      }),
    ).resolves.toMatchObject({ allowed: false });
  });
});
