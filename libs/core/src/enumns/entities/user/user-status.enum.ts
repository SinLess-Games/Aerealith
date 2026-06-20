// libs/core/src/enumns/entities/user/user-status.enum.ts

/**
 * User online/presence status values.
 */
export const UserStatus = {
  Offline: 'offline',
  Online: 'online',
  Away: 'away',
  Busy: 'busy',
  DoNotDisturb: 'do_not_disturb',
  Invisible: 'invisible',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const DefaultUserStatus = UserStatus.Offline;

export const UserStatusValues = Object.values(UserStatus);

export function isUserStatus(value: unknown): value is UserStatus {
  return (
    typeof value === 'string' &&
    UserStatusValues.includes(value as UserStatus)
  );
}