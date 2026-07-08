'use strict';
// libs/core/src/enumns/system/user-role.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserRoleValues = exports.DefaultUserRole = exports.UserRole = void 0;
exports.isUserRole = isUserRole;
/**
 * System user role values.
 *
 * Keep roles broad.
 * Put fine-grained access rules in permissions/policies later.
 */
exports.UserRole = {
  Guest: 'guest',
  User: 'user',
  Support: 'support',
  Moderator: 'moderator',
  Developer: 'developer',
  Admin: 'admin',
  SuperAdmin: 'super_admin',
  Service: 'service',
  System: 'system',
};
exports.DefaultUserRole = exports.UserRole.User;
exports.UserRoleValues = Object.values(exports.UserRole);
function isUserRole(value) {
  return typeof value === 'string' && exports.UserRoleValues.includes(value);
}
//# sourceMappingURL=user-role.enum.js.map
