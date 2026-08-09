export const AuthEvent = {
  PasswordAuthenticationSucceeded: 'auth.password.succeeded',
  PasswordAuthenticationFailed: 'auth.password.failed',
  PasswordResetRequested: 'auth.password.reset_requested',
  PasswordResetCompleted: 'auth.password.reset_completed',
  SessionCreated: 'auth.session.created',
  SessionRevoked: 'auth.session.revoked',
  AllSessionsRevoked: 'auth.session.all_revoked',
} as const;

export type AuthEvent = (typeof AuthEvent)[keyof typeof AuthEvent];
