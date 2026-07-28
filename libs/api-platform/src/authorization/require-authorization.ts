import type {
  AuthorizationPrincipal,
  AuthorizationScope,
  AuthorizationService,
} from '@aerealith-ai/authorization';
import { HttpStatus } from '@aerealith-ai/core';

import { ApiError } from '../errors/api-error';
import { ApiErrorCode } from '../errors/api-error-code.enum';

export interface RequireAuthorizationInput {
  readonly authorization: AuthorizationService;
  readonly principal: AuthorizationPrincipal | undefined;
  readonly permission: string;
  readonly scope: AuthorizationScope;
  readonly resource?: Readonly<Record<string, unknown>>;
}

export async function requireAuthorization(
  input: RequireAuthorizationInput,
): Promise<void> {
  const decision = await input.authorization.can(input);
  if (!decision.allowed) {
    throw new ApiError('Forbidden', {
      code: ApiErrorCode.Forbidden,
      status: HttpStatus.Forbidden,
    });
  }
}
