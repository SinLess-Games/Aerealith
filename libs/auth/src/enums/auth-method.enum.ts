export const AuthMethod = {
  Password: 'password',
  OAuth: 'oauth',
} as const;

export type AuthMethod = (typeof AuthMethod)[keyof typeof AuthMethod];
