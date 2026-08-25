import { and, eq } from 'drizzle-orm';

import type { DatabaseClient } from '@aerealith-ai/db';
import { schema } from '@aerealith-ai/db';

const DefaultPlatformRoleSlug = 'user';

/** Assign the canonical least-privilege platform role during registration. */
export async function assignDefaultPlatformUserRole(
  database: DatabaseClient,
  userId: string,
): Promise<void> {
  const [role] = await database
    .select({ id: schema.rolesTable.id })
    .from(schema.rolesTable)
    .where(
      and(
        eq(schema.rolesTable.scope, 'platform'),
        eq(schema.rolesTable.slug, DefaultPlatformRoleSlug),
      ),
    )
    .limit(1);

  if (!role) {
    throw new Error(
      'The canonical platform user role is unavailable. Run the authorization seed.',
    );
  }

  await database
    .insert(schema.platformRoleAssignmentsTable)
    .values({ userId, roleId: role.id, assignedByUserId: null })
    .onConflictDoNothing();
}
