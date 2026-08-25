/** Derived status for the core/db session shape. */
export const SessionStatus = {
  Active: 'active',
  Expired: 'expired',
  Revoked: 'revoked',
} as const;

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];
