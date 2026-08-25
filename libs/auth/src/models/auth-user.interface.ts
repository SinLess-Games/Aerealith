import type { UserContract, UserEntity } from '@aerealith-ai/core';

/** Core is the single source of truth for authenticated users. */
export type AuthUser = UserEntity;

/** Safe user data returned by authentication flows. */
export type AuthenticatedUser = UserContract;
