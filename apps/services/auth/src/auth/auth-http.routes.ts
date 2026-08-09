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
import { z } from 'zod';

import type { AuthApplication } from './auth-application.service';
import type { AdminEntityType } from './auth-application.service';
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

  router.get('/account', async (context) => {
    const user = await requireAccountAccess(context, application);
    return context.json(
      success(context, await application.accountDetails(user.id)),
    );
  });

  router.patch('/account', async (context) => {
    const user = await requireAccountAccess(context, application);
    try {
      const input = await parseJsonBody(
        context,
        z.object({
          username: z.string().trim().min(3).max(32),
          email: z.email().max(320),
          avatarUrl: z
            .string()
            .max(2_800_000)
            .refine(
              (value) =>
                value.startsWith('data:image/png;base64,') ||
                value.startsWith('data:image/jpeg;base64,') ||
                value.startsWith('data:image/svg+xml;base64,'),
              'Avatar must be a PNG, JPEG, or SVG data URL.',
            )
            .nullable()
            .optional(),
          timezone: z.string().trim().max(100).nullable().optional(),
          locale: z.string().trim().max(100).nullable().optional(),
        }),
      );
      return context.json(
        success(context, await application.updateAccount(user.id, input)),
      );
    } catch (error) {
      throw normalizeAuthError(error);
    }
  });

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

  router.get('/admin/overview', async (context) => {
    const user = await application.currentUser(readSessionCookie(context));
    if (!user) {
      throw new ApiError('Authentication is required.', {
        code: ApiErrorCode.Unauthorized,
        status: HttpStatus.Unauthorized,
      });
    }
    await requireAuthorization({
      authorization: context.get('apiContext').authorization,
      principal: { id: user.id, type: 'user' },
      permission: 'users.read',
      scope: { type: 'global' },
    });
    return context.json(success(context, await application.adminOverview()));
  });

  router.get('/admin/entities/:entity', async (context) => {
    const user = await requireAdminPermission(
      context,
      application,
      context.req.param('entity') === 'sessions'
        ? 'sessions.read'
        : 'users.read',
    );
    void user;
    const entity = parseEntityType(context.req.param('entity'));
    const page = positiveInteger(context.req.query('page'), 1);
    const pageSize = Math.min(
      100,
      positiveInteger(context.req.query('pageSize'), 25),
    );
    return context.json(
      success(
        context,
        await application.listAdminEntities(
          entity,
          context.req.query('search')?.trim() ?? '',
          page,
          pageSize,
        ),
      ),
    );
  });

  router.patch('/admin/entities/:entity/:id', async (context) => {
    const entity = parseEntityType(context.req.param('entity'));
    await requireAdminPermission(
      context,
      application,
      entity === 'sessions' ? 'sessions.revoke' : 'users.update',
    );
    try {
      const changes = await parseJsonBody(
        context,
        z.record(z.string(), z.unknown()),
      );
      return context.json(
        success(
          context,
          await application.updateAdminEntity(
            entity,
            context.req.param('id'),
            changes,
          ),
        ),
      );
    } catch (error) {
      throw normalizeAuthError(error);
    }
  });

  router.delete('/admin/entities/:entity/:id', async (context) => {
    const entity = parseEntityType(context.req.param('entity'));
    const user = await requireAdminPermission(
      context,
      application,
      entity === 'sessions' ? 'sessions.revoke' : 'users.delete',
    );
    try {
      await application.deleteAdminEntity(
        entity,
        context.req.param('id'),
        user.id,
      );
      return context.json(success(context, null));
    } catch (error) {
      throw normalizeAuthError(error);
    }
  });
}

async function requireAccountAccess(
  context: Context<AuthApiEnv>,
  application: AuthApplication,
) {
  const user = await application.currentUser(readSessionCookie(context));
  if (!user) {
    throw new ApiError('Authentication is required.', {
      code: ApiErrorCode.Unauthorized,
      status: HttpStatus.Unauthorized,
    });
  }
  await requireAuthorization({
    authorization: context.get('apiContext').authorization,
    principal: { id: user.id, type: 'user' },
    permission: 'account.read',
    scope: { type: 'resource', id: user.id },
  });
  return user;
}

function parseEntityType(value: string): AdminEntityType {
  if (value === 'users' || value === 'sessions') return value;
  throw new ApiError('Unsupported entity type.', {
    code: ApiErrorCode.ValidationFailed,
    status: HttpStatus.NotFound,
  });
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function requireAdminPermission(
  context: Context<AuthApiEnv>,
  application: AuthApplication,
  permission: string,
) {
  const user = await application.currentUser(readSessionCookie(context));
  if (!user) {
    throw new ApiError('Authentication is required.', {
      code: ApiErrorCode.Unauthorized,
      status: HttpStatus.Unauthorized,
    });
  }
  await requireAuthorization({
    authorization: context.get('apiContext').authorization,
    principal: { id: user.id, type: 'user' },
    permission,
    scope: { type: 'global' },
  });
  return user;
}
