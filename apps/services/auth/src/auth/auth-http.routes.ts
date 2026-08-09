import {
  LoginRequestSchema,
  SignUpRequestSchema,
  VerifyEmailRequestSchema,
  ResendVerificationRequestSchema,
  PasswordResetRequestSchema,
  PasswordResetCompleteSchema,
  HttpStatus,
  EmailSchema,
  UsernameSchema,
  UserLifecycleStatus,
  UserTier,
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
    const user = await requireAccountAccess(
      context,
      application,
      'account.read',
    );
    return context.json(
      success(context, await application.accountDetails(user.id)),
    );
  });

  router.patch('/account', async (context) => {
    const user = await requireAccountAccess(
      context,
      application,
      'account.update',
    );
    try {
      const input = await parseJsonBody(
        context,
        z.object({
          username: UsernameSchema,
          email: EmailSchema,
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
      const emailChanged = input.email !== user.email;
      const result = await application.updateAccount(user.id, input);
      if (emailChanged) clearSessionCookie(context);
      return context.json(success(context, result));
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

  router.post('/auth/password-reset/request', async (context) => {
    try {
      const { email } = await parseJsonBody(
        context,
        PasswordResetRequestSchema,
      );
      await application.requestPasswordReset(email);
      return context.json(success(context, null));
    } catch (error) {
      throw normalizeAuthError(error);
    }
  });

  router.post('/auth/password-reset/complete', async (context) => {
    try {
      const input = await parseJsonBody(context, PasswordResetCompleteSchema);
      await application.completePasswordReset(input.token, input.newPassword);
      clearSessionCookie(context);
      return context.json(success(context, null));
    } catch (error) {
      throw normalizeAuthError(error);
    }
  });

  router.get('/auth/sessions', async (context) => {
    const user = await requireSessionPermission(
      context,
      application,
      'sessions.read',
    );
    void user;
    const token = readSessionCookie(context);
    return context.json(
      success(context, { sessions: await application.listSessions(token!) }),
    );
  });

  router.delete('/auth/sessions/:id', async (context) => {
    await requireSessionPermission(context, application, 'sessions.revoke');
    const token = readSessionCookie(context);
    if (!(await application.revokeSession(token!, context.req.param('id')))) {
      throw new ApiError('Session not found.', {
        code: ApiErrorCode.NotFound,
        status: HttpStatus.NotFound,
      });
    }
    return context.json(success(context, null));
  });

  router.delete('/auth/sessions', async (context) => {
    await requireSessionPermission(context, application, 'sessions.revoke_all');
    const token = readSessionCookie(context);
    await application.revokeOtherSessions(token!);
    return context.json(success(context, null));
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
    const entity = parseEntityType(context.req.param('entity'));
    const user = await requireAdminPermission(
      context,
      application,
      entity === 'sessions' ? ['users.read', 'sessions.read'] : 'users.read',
    );
    void user;
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
    try {
      const changes: Record<string, unknown> =
        entity === 'users'
          ? await parseJsonBody(context, AdminUserChangesSchema)
          : await parseJsonBody(context, AdminSessionChangesSchema);
      const permissions =
        entity === 'sessions'
          ? ['users.update', 'sessions.revoke']
          : [
              'users.update',
              ...(changes['status'] !== undefined ? ['users.suspend'] : []),
              ...(changes['email'] !== undefined ||
              changes['tier'] !== undefined
                ? ['users.manage']
                : []),
            ];
      await requireAdminPermission(context, application, permissions);
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
      entity === 'sessions'
        ? ['users.update', 'sessions.revoke']
        : 'users.delete',
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

const AdminUserChangesSchema = z
  .object({
    username: UsernameSchema.optional(),
    email: EmailSchema.optional(),
    status: z.enum(UserLifecycleStatus).optional(),
    tier: z.enum(UserTier).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'At least one supported user field is required.',
  });

const AdminSessionChangesSchema = z
  .object({
    deviceName: z.string().trim().min(1).max(255).nullable().optional(),
    revokedAt: z.iso.datetime().nullable().optional(),
  })
  .strict()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'At least one supported session field is required.',
  });

async function requireAccountAccess(
  context: Context<AuthApiEnv>,
  application: AuthApplication,
  permission: 'account.read' | 'account.update',
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
    scope: { type: 'resource', id: user.id },
  });
  return user;
}

async function requireSessionPermission(
  context: Context<AuthApiEnv>,
  application: AuthApplication,
  permission: string,
) {
  const user = await application.currentUser(readSessionCookie(context));
  if (!user)
    throw new ApiError('Authentication is required.', {
      code: ApiErrorCode.Unauthorized,
      status: HttpStatus.Unauthorized,
    });
  await requireAuthorization({
    authorization: context.get('apiContext').authorization,
    principal: { id: user.id, type: 'user' },
    permission,
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
  permission: string | readonly string[],
) {
  const user = await application.currentUser(readSessionCookie(context));
  if (!user) {
    throw new ApiError('Authentication is required.', {
      code: ApiErrorCode.Unauthorized,
      status: HttpStatus.Unauthorized,
    });
  }
  const permissions =
    typeof permission === 'string' ? [permission] : permission;
  for (const requiredPermission of permissions) {
    await requireAuthorization({
      authorization: context.get('apiContext').authorization,
      principal: { id: user.id, type: 'user' },
      permission: requiredPermission,
      scope: { type: 'global' },
    });
  }
  return user;
}
