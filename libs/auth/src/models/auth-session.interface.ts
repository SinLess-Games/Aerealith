import type { UserSessionContract } from '@aerealith-ai/core';

/** Safe session shape shared by core and db. */
export type AuthSession = UserSessionContract;

export type IssuedAuthSession = {
  readonly token: string;
  readonly session: UserSessionContract;
};
