/**
 * System user role values.
 *
 * Keep roles broad.
 * Put fine-grained access rules in permissions/policies later.
 */
export declare const UserRole: {
  readonly Guest: 'guest';
  readonly User: 'user';
  readonly Support: 'support';
  readonly Moderator: 'moderator';
  readonly Developer: 'developer';
  readonly Admin: 'admin';
  readonly SuperAdmin: 'super_admin';
  readonly Service: 'service';
  readonly System: 'system';
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export declare const DefaultUserRole: 'user';
export declare const UserRoleValues: (
  | 'developer'
  | 'user'
  | 'guest'
  | 'support'
  | 'moderator'
  | 'admin'
  | 'super_admin'
  | 'service'
  | 'system'
)[];
export declare function isUserRole(value: unknown): value is UserRole;
