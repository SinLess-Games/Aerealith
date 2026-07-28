import {
  ApiError,
  ApiErrorCode,
  normalizeApiError,
} from '@aerealith-ai/api-platform';
import { HttpStatus, type ApiSuccessResponse } from '@aerealith-ai/core';
import { TRPCError } from '@trpc/server';
import type { Context } from 'hono';
import { GraphQLError } from 'graphql';
import type { ZodType } from 'zod';

import { AuthApplicationError } from './auth-application.service';
import type { AuthApiEnv } from './auth-api-context';

export async function parseJsonBody<T>(
  context: Context<AuthApiEnv>,
  schema: ZodType<T>,
): Promise<T> {
  let body: unknown;
  try {
    body = await context.req.json();
  } catch {
    throw new ApiError('A valid JSON request body is required.', {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.BadRequest,
    });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('The request payload is invalid.', {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.UnprocessableEntity,
      metadata: {
        issues: parsed.error.issues.map(({ code, message, path }) => ({
          code,
          message,
          path,
        })),
      },
    });
  }
  return parsed.data;
}

export function success<T>(
  context: Context<AuthApiEnv>,
  data: T,
): ApiSuccessResponse<T> {
  const request = context.get('apiContext');
  return {
    ok: true,
    data,
    meta: {
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      path: new URL(context.req.url).pathname,
    },
  };
}

export function normalizeAuthError(error: unknown): ApiError {
  if (error instanceof AuthApplicationError) {
    return new ApiError(error.message, {
      code: error.code,
      status: error.status,
      cause: error,
    });
  }
  return normalizeApiError(error);
}

export function toTrpcError(error: unknown): TRPCError {
  const normalized = normalizeAuthError(error);
  return new TRPCError({
    code:
      normalized.status === HttpStatus.Unauthorized
        ? 'UNAUTHORIZED'
        : normalized.status === HttpStatus.Conflict
          ? 'CONFLICT'
          : normalized.status < HttpStatus.InternalServerError
            ? 'BAD_REQUEST'
            : 'INTERNAL_SERVER_ERROR',
    message: normalized.message,
    cause: error,
  });
}

export function toGraphqlError(error: unknown): GraphQLError {
  const normalized = normalizeAuthError(error);
  return new GraphQLError(normalized.message, {
    extensions: {
      code: normalized.code,
      http: { status: normalized.status },
    },
    originalError: error instanceof Error ? error : undefined,
  });
}
