// libs/core/src/enumns/system/user-role.enum.ts

/**
 * System user role values.
 *
 * Keep roles broad.
 * Put fine-grained access rules in permissions/policies later.
 */
export const UserRole = {
  Guest: 'guest',
  User: 'user',

  Support: 'support',
  Moderator: 'moderator',
  Developer: 'developer',
  Admin: 'admin',
  SuperAdmin: 'super_admin',

  Service: 'service',
  System: 'system',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const DefaultUserRole = UserRole.User;

export const UserRoleValues = Object.values(UserRole);

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && UserRoleValues.includes(value as UserRole);
}