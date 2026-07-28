import type {
  UserLifecycleStatus,
  UserRole,
  UserTier,
} from '@aerealith-ai/core';

export interface AuthPrincipal {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly status: UserLifecycleStatus;
  readonly role: UserRole;
  readonly tier: UserTier;
  readonly authenticatedAt: Date;
}
