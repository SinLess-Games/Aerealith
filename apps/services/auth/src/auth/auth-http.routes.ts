import {
  LoginRequestSchema,
  SignUpRequestSchema,
  VerifyEmailRequestSchema,
  ResendVerificationRequestSchema,
  HttpStatus,
} from '@aerealith-ai/core';
import {
  ApiError,
  ApiErrorCode,
  requireAuthorization,
} from '@aerealith-ai/api-platform';
import type { Context, Hono } from 'hono';

import type { AuthApplication } from './auth-application.service';
import type { AuthApiEnv } from './auth-api-context';
import {
  normalizeAuthError,
  parseJsonBody,
  success,
} from './auth-transport.helpers';
import {
  clearSessionCookie,
  readSessionCookie,
  writeSessionCookie,
} from './session-cookie';

export function registerAuthHttpRoutes(
  router: Hono<AuthApiEnv>,
  application: AuthApplication,
): void {
  router.post('/auth/sign-up', async (context) => {
    try {
      const input = await parseJsonBody(context, SignUpRequestSchema);
      const result = await application.signUp({
        ...input,
        displayName: input.displayName ?? undefined,
      });
      writeSessionCookie(context, result.sessionToken);
      return context.json(success(context, result.user), HttpStatus.Created);
    } catch (error) {
      throw normalizeAuthError(error);
    }
  });

  router.post('/auth/login', async (context) => {
    try {
      const input = await parseJsonBody(context, LoginRequestSchema);
      const result = await application.login(input);
      writeSessionCookie(context, result.sessionToken);
      return context.json(success(context, result.user));
    } catch (error) {
      throw normalizeAuthError(error);
    }
  });

  const currentUser = async (
    context: Context<AuthApiEnv>,
    authorize: boolean,
  ) => {
    const user = await application.currentUser(readSessionCookie(context));
    if (!user) {
      throw new ApiError('Authentication is required.', {
        code: ApiErrorCode.Unauthorized,
        status: HttpStatus.Unauthorized,
      });
    }
    if (authorize) {
      await requireAuthorization({
        authorization: context.get('apiContext').authorization,
        principal: { id: user.id, type: 'user' },
        permission: 'account.read',
        scope: { type: 'resource', id: user.id },
      });
    }
    return context.json(success(context, user));
  };

  router.get('/auth/me', (context) => currentUser(context, false));
  router.get('/users/me', (context) => currentUser(context, true));

  router.post('/auth/logout', async (context) => {
    await application.logout(readSessionCookie(context));
    clearSessionCookie(context);
    return context.json(success(context, null));
  });

  router.post('/auth/verify-email', async (context) => {
    try {
      const { token } = await parseJsonBody(context, VerifyEmailRequestSchema);
      return context.json(
        success(context, await application.verifyEmail(token)),
      );
    } catch (error) {
      throw normalizeAuthError(error);
    }
  });

  router.post('/auth/resend-verification', async (context) => {
    try {
      const { email } = await parseJsonBody(
        context,
        ResendVerificationRequestSchema,
      );
      await application.resendVerification(email);
      return context.json(success(context, null));
    } catch (error) {
      throw normalizeAuthError(error);
    }
  });
}
