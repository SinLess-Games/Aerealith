import type { UserContract } from '@aerealith-ai/core';

import type { AuthPrincipal } from '../models/auth-principal.interface';

export interface AuthenticationResult {
  readonly principal: AuthPrincipal;
  readonly user: UserContract;
}
