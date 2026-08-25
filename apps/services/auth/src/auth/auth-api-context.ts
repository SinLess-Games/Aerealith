import type {
  ApiEnv,
  AuthorizationApiContext,
} from '@aerealith-ai/api-platform';
import type { Context } from 'hono';

import type { AuthApplication } from './auth-application.service';

export interface AuthApiContext extends AuthorizationApiContext {
  readonly auth: AuthApplication;
}

export type AuthApiEnv = ApiEnv<AuthApiContext>;

export interface AuthTransportContext extends Record<string, unknown> {
  readonly apiContext: AuthApiContext;
  readonly honoContext: Context<AuthApiEnv>;
}
