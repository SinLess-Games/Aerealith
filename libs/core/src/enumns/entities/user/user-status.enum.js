'use strict';
// libs/core/src/enumns/entities/user/user-status.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserStatusValues =
  exports.DefaultUserStatus =
  exports.UserStatus =
    void 0;
exports.isUserStatus = isUserStatus;
/**
 * User online/presence status values.
 */
exports.UserStatus = {
  Offline: 'offline',
  Online: 'online',
  Away: 'away',
  Busy: 'busy',
  DoNotDisturb: 'do_not_disturb',
  Invisible: 'invisible',
};
exports.DefaultUserStatus = exports.UserStatus.Offline;
exports.UserStatusValues = Object.values(exports.UserStatus);
function isUserStatus(value) {
  return typeof value === 'string' && exports.UserStatusValues.includes(value);
}
//# sourceMappingURL=user-status.enum.js.map
