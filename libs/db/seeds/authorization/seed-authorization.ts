// libs/db/seeds/authorization/seed-authorization.ts

import type { DatabaseClient } from '../../src/client';

import { seedAuthorizationPermissions } from './permissions.seed';
import { seedAuthorizationRolePermissions } from './role-permissions.seed';
import { seedAuthorizationRoles } from './roles.seed';

/**
 * Seeds the complete canonical authorization catalog.
 *
 * Seed order matters:
 *
 *   permissions
 *       ↓
 *   roles
 *       ↓
 *   role_permissions
 *
 * Role-permission relationships depend on both permissions and roles already
 * existing, so they must always run last.
 *
 * The entire authorization seed runs inside a single transaction. If any
 * stage fails, no partial authorization catalog is committed.
 */
export async function seedAuthorization(
  database: DatabaseClient,
): Promise<void> {
  await database.transaction(async (transaction) => {
    const transactionDatabase = transaction as unknown as DatabaseClient;

    await seedAuthorizationPermissions(transactionDatabase);

    await seedAuthorizationRoles(transactionDatabase);

    await seedAuthorizationRolePermissions(transactionDatabase);
  });
}
