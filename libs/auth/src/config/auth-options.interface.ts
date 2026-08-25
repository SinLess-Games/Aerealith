export interface PasswordPolicyOptions {
  readonly minimumLength?: number;
  readonly maximumLength?: number;
  readonly requireLowercase?: boolean;
  readonly requireUppercase?: boolean;
  readonly requireNumber?: boolean;
  readonly requireSymbol?: boolean;
}

export interface SessionPolicyOptions {
  readonly lifetimeMs?: number;
  readonly tokenEntropyBytes?: number;
}

export interface AuthOptions {
  readonly requireVerifiedEmail?: boolean;
  readonly password?: PasswordPolicyOptions;
  readonly session?: SessionPolicyOptions;
  readonly now?: () => Date;
}

export const DEFAULT_AUTH_OPTIONS = {
  requireVerifiedEmail: true,
  password: {
    minimumLength: 12,
    maximumLength: 128,
    requireLowercase: true,
    requireUppercase: true,
    requireNumber: true,
    requireSymbol: false,
  },
  session: {
    lifetimeMs: 1000 * 60 * 60 * 24 * 30,
    tokenEntropyBytes: 32,
  },
} as const satisfies AuthOptions;
