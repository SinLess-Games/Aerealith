export const AuthFailureReason = {
  InvalidCredentials: 'invalid_credentials',
  AccountDisabled: 'account_disabled',
  AccountSuspended: 'account_suspended',
  EmailNotVerified: 'email_not_verified',
  SessionExpired: 'session_expired',
  SessionRevoked: 'session_revoked',
} as const;

export type AuthFailureReason =
  (typeof AuthFailureReason)[keyof typeof AuthFailureReason];
