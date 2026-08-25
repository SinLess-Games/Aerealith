// libs/db/src/transactions/assign-platform-role.transaction.ts

import type { RoleAssignment } from '@aerealith-ai/authorization';

import type { DatabaseClient } from '../client';

import { roleById } from '../queries/authorization';

import { DrizzleAuthorizationRepository } from '../repositories/authorization';

import { PermissionScope } from '../schema/authorization/permissions';
import { roles } from '../schema/authorization/roles';

import { withTransaction } from './with-transaction';

export interface AssignPlatformRoleTransactionInput {
  /**
   * User receiving the platform role.
   */
  readonly userId: string;

  /**
   * Platform-scoped role to assign.
   */
  readonly roleId: string;

  /**
   * User performing the assignment.
   *
   * This is provenance only. Whether the actor is permitted to assign the
   * requested role must be established by the authorization/service layer
   * before this transaction executes.
   */
  readonly assignedByUserId: string;

  /**
   * Optional expiration for temporary platform access.
   *
   * Omit this value for a non-expiring assignment.
   */
  readonly expiresAt?: Date;
}

export interface AssignPlatformRoleTransactionResult {
  readonly assignment: RoleAssignment;
}

/**
 * Assigns a platform-scoped role to a user and invalidates that user's cached
 * authorization state atomically.
 *
 * The transaction performs:
 *
 *   validate role scope
 *       ↓
 *   platform role assignment
 *       ↓
 *   principal authorization version increment
 *
 * If either the assignment or authorization-version update fails, the entire
 * operation rolls back.
 *
 * Policy decisions such as:
 *
 *   whether the actor may assign platform roles
 *   administrative-rank restrictions
 *   role conflicts
 *
 * belong to the authorization/service layer. This transaction is responsible
 * for enforcing persistence invariants and atomicity.
 */
export async function assignPlatformRoleTransaction(
  database: DatabaseClient,
  input: AssignPlatformRoleTransactionInput,
): Promise<AssignPlatformRoleTransactionResult> {
  assertValidExpiration(input.expiresAt);

  return withTransaction(database, async (transaction) => {
    const [role] = await transaction
      .select({
        id: roles.id,
        scope: roles.scope,
      })
      .from(roles)
      .where(roleById(input.roleId))
      .limit(1);

    if (!role) {
      throw new Error('Role not found.');
    }

    if (role.scope !== PermissionScope.Platform) {
      throw new Error(
        'Only platform-scoped roles can be assigned as platform roles.',
      );
    }

    const transactionDatabase = transaction as unknown as DatabaseClient;

    const authorizationRepository = new DrizzleAuthorizationRepository(
      transactionDatabase,
    );

    /**
     * The current authorization-domain global scope maps directly to the
     * normalized database platform assignment boundary.
     *
     * The repository persists this through platform_role_assignments rather
     * than a generalized principal-role table.
     */
    const assignment = await authorizationRepository.assignRole({
      principal: {
        id: input.userId,
        type: 'user',
      },

      roleId: role.id,

      scope: {
        type: 'global',
      },

      assignedBy: input.assignedByUserId,

      ...(input.expiresAt
        ? {
            expiresAt: input.expiresAt,
          }
        : {}),
    });

    /**
     * Invalidate effective-authorization caches in the same transaction as
     * the role assignment.
     */
    await authorizationRepository.incrementPrincipalVersion({
      id: input.userId,
      type: 'user',
    });

    return {
      assignment,
    };
  });
}

/**
 * Prevents creating a platform assignment that is already expired.
 *
 * Equality is also rejected because an assignment expiring at the current
 * instant is considered inactive by the authorization queries.
 */
function assertValidExpiration(expiresAt: Date | undefined): void {
  if (expiresAt !== undefined && expiresAt.getTime() <= Date.now()) {
    throw new Error(
      'Platform role assignment expiration must be in the future.',
    );
  }
}
