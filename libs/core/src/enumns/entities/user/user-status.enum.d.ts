/**
 * User online/presence status values.
 */
export declare const UserStatus: {
  readonly Offline: 'offline';
  readonly Online: 'online';
  readonly Away: 'away';
  readonly Busy: 'busy';
  readonly DoNotDisturb: 'do_not_disturb';
  readonly Invisible: 'invisible';
};
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export declare const DefaultUserStatus: 'offline';
export declare const UserStatusValues: (
  'offline' | 'online' | 'away' | 'busy' | 'do_not_disturb' | 'invisible'
)[];
export declare function isUserStatus(value: unknown): value is UserStatus;
