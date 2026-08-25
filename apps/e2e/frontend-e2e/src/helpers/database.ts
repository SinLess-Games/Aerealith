import { and, eq } from 'drizzle-orm';

import {
  createDatabaseConnection,
  schema,
  type DatabaseClientConnection,
} from '@aerealith-ai/db';

const FixtureEmailSuffix = '@e2e.aerealith.invalid';
const FixtureUsernamePrefix = 'e2e_';

type LifecycleStatus = 'active' | 'disabled' | 'suspended';

export class E2EDatabase {
  private readonly connection: DatabaseClientConnection;

  constructor(
    databaseUrl: string,
    private readonly runId: string,
  ) {
    this.connection = createDatabaseConnection({ DATABASE_URL: databaseUrl });
  }

  async ready(): Promise<void> {
    await this.connection.pool.query('select 1');
  }

  async close(): Promise<void> {
    await this.connection.close();
  }

  async markFixture(userId: string): Promise<void> {
    const user = await this.requireFixtureIdentity(userId);
    await this.connection.client
      .update(schema.usersTable)
      .set({
        metadata: {
          ...user.metadata,
          e2eFixture: true,
          e2eRunId: this.runId,
        },
        updatedAt: new Date(),
      })
      .where(eq(schema.usersTable.id, userId));
  }

  async assignCanonicalUserRole(userId: string): Promise<void> {
    await this.requireMarkedFixture(userId);
    const [role] = await this.connection.client
      .select({ id: schema.rolesTable.id })
      .from(schema.rolesTable)
      .where(
        and(
          eq(schema.rolesTable.scope, 'platform'),
          eq(schema.rolesTable.slug, 'user'),
        ),
      )
      .limit(1);
    if (!role) {
      throw new Error(
        'The canonical platform user role is missing; run the authorization seed.',
      );
    }
    await this.connection.client
      .insert(schema.platformRoleAssignmentsTable)
      .values({ userId, roleId: role.id, assignedByUserId: null })
      .onConflictDoNothing();
  }

  async setLifecycleStatus(
    userId: string,
    status: LifecycleStatus,
  ): Promise<void> {
    await this.requireMarkedFixture(userId);
    await this.connection.client
      .update(schema.usersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.usersTable.id, userId));
  }

  async setEmailVerified(userId: string, verified: boolean): Promise<void> {
    await this.requireMarkedFixture(userId);
    const now = new Date();
    await this.connection.client
      .update(schema.usersTable)
      .set({
        emailVerified: verified,
        emailVerifiedAt: verified ? now : null,
        updatedAt: now,
      })
      .where(eq(schema.usersTable.id, userId));
  }

  async setLegacyRoleProjection(
    userId: string,
    role: 'user' | 'super_admin',
  ): Promise<void> {
    await this.requireMarkedFixture(userId);
    await this.connection.client
      .update(schema.usersTable)
      .set({ role, updatedAt: new Date() })
      .where(eq(schema.usersTable.id, userId));
  }

  async softDeleteUser(userId: string): Promise<void> {
    await this.requireMarkedFixture(userId);
    const now = new Date();
    await this.connection.client
      .update(schema.usersTable)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(schema.usersTable.id, userId));
  }

  async expireSession(
    sessionId: string,
    expiresAt = new Date(),
  ): Promise<void> {
    const [session] = await this.connection.client
      .select({ userId: schema.userSessionsTable.userId })
      .from(schema.userSessionsTable)
      .where(eq(schema.userSessionsTable.id, sessionId))
      .limit(1);
    if (!session) throw new Error('E2E session fixture was not found.');
    await this.requireMarkedFixture(session.userId);
    await this.connection.client
      .update(schema.userSessionsTable)
      .set({ expiresAt, updatedAt: new Date() })
      .where(eq(schema.userSessionsTable.id, sessionId));
  }

  async createPasswordResetToken(
    userId: string,
    tokenHash: string,
  ): Promise<void> {
    await this.requireMarkedFixture(userId);
    await this.connection.client
      .insert(schema.userPasswordResetTokensTable)
      .values({
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 5 * 60_000),
      });
  }

  async authorizationSnapshot(userId: string): Promise<{
    legacyRole: string;
    roleSlugs: string[];
    permissionKeys: string[];
  }> {
    const user = await this.requireMarkedFixture(userId);
    const [roleRows, permissionRows] = await Promise.all([
      this.connection.client
        .select({ slug: schema.rolesTable.slug })
        .from(schema.platformRoleAssignmentsTable)
        .innerJoin(
          schema.rolesTable,
          eq(schema.platformRoleAssignmentsTable.roleId, schema.rolesTable.id),
        )
        .where(eq(schema.platformRoleAssignmentsTable.userId, userId)),
      this.connection.client
        .select({ key: schema.permissionsTable.key })
        .from(schema.platformRoleAssignmentsTable)
        .innerJoin(
          schema.rolePermissionsTable,
          eq(
            schema.platformRoleAssignmentsTable.roleId,
            schema.rolePermissionsTable.roleId,
          ),
        )
        .innerJoin(
          schema.permissionsTable,
          eq(
            schema.rolePermissionsTable.permissionId,
            schema.permissionsTable.id,
          ),
        )
        .where(eq(schema.platformRoleAssignmentsTable.userId, userId)),
    ]);
    return {
      legacyRole: user.role,
      roleSlugs: [...new Set(roleRows.map(({ slug }) => slug))].sort(),
      permissionKeys: [...new Set(permissionRows.map(({ key }) => key))].sort(),
    };
  }

  async platformOwnerPermissionCoverage(userId: string): Promise<{
    canonical: string[];
    assigned: string[];
    missing: string[];
  }> {
    const [canonicalRows, assignedRows] = await Promise.all([
      this.connection.client
        .select({ key: schema.permissionsTable.key })
        .from(schema.permissionsTable)
        .where(eq(schema.permissionsTable.scope, 'platform')),
      this.connection.client
        .select({ key: schema.permissionsTable.key })
        .from(schema.platformRoleAssignmentsTable)
        .innerJoin(
          schema.rolesTable,
          eq(schema.platformRoleAssignmentsTable.roleId, schema.rolesTable.id),
        )
        .innerJoin(
          schema.rolePermissionsTable,
          eq(
            schema.platformRoleAssignmentsTable.roleId,
            schema.rolePermissionsTable.roleId,
          ),
        )
        .innerJoin(
          schema.permissionsTable,
          eq(
            schema.rolePermissionsTable.permissionId,
            schema.permissionsTable.id,
          ),
        )
        .where(
          and(
            eq(schema.platformRoleAssignmentsTable.userId, userId),
            eq(schema.rolesTable.slug, 'platform-owner'),
            eq(schema.permissionsTable.scope, 'platform'),
          ),
        ),
    ]);
    const canonical = [...new Set(canonicalRows.map(({ key }) => key))].sort();
    const assigned = [...new Set(assignedRows.map(({ key }) => key))].sort();
    const assignedSet = new Set(assigned);
    return {
      canonical,
      assigned,
      missing: canonical.filter((key) => !assignedSet.has(key)),
    };
  }

  async cleanup(userIds: Iterable<string>): Promise<void> {
    for (const userId of userIds) {
      await this.requireMarkedFixture(userId);
      const ownerAssignment = await this.connection.client
        .select({ id: schema.platformRoleAssignmentsTable.roleId })
        .from(schema.platformRoleAssignmentsTable)
        .innerJoin(
          schema.rolesTable,
          eq(schema.platformRoleAssignmentsTable.roleId, schema.rolesTable.id),
        )
        .where(
          and(
            eq(schema.platformRoleAssignmentsTable.userId, userId),
            eq(schema.rolesTable.slug, 'platform-owner'),
          ),
        )
        .limit(1);
      if (ownerAssignment.length > 0) {
        throw new Error('Refusing to clean up a platform-owner account.');
      }
      await this.connection.client
        .delete(schema.usersTable)
        .where(eq(schema.usersTable.id, userId));
    }
  }

  private async requireMarkedFixture(userId: string) {
    const user = await this.requireFixtureIdentity(userId);
    if (
      user.metadata['e2eFixture'] !== true ||
      user.metadata['e2eRunId'] !== this.runId
    ) {
      throw new Error('Refusing to mutate an unmarked E2E account.');
    }
    return user;
  }

  private async requireFixtureIdentity(userId: string) {
    const [user] = await this.connection.client
      .select({
        id: schema.usersTable.id,
        username: schema.usersTable.username,
        email: schema.usersTable.email,
        role: schema.usersTable.role,
        metadata: schema.usersTable.metadata,
      })
      .from(schema.usersTable)
      .where(eq(schema.usersTable.id, userId))
      .limit(1);
    if (
      !user ||
      !user.username.startsWith(FixtureUsernamePrefix) ||
      !user.email.endsWith(FixtureEmailSuffix)
    ) {
      throw new Error('Refusing to mutate a non-E2E account.');
    }
    return user;
  }
}

export const e2eIdentityRules = {
  emailSuffix: FixtureEmailSuffix,
  usernamePrefix: FixtureUsernamePrefix,
} as const;
