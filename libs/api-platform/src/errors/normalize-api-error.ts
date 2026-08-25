import { AerealithError, HttpStatus } from '@aerealith-ai/core';
import { HTTPException } from 'hono/http-exception';

import { ApiError } from './api-error';
import { ApiErrorCode } from './api-error-code.enum';

/** Converts unknown failures to a safe model shared by every transport. */
export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof AerealithError) {
    return new ApiError(error.message, {
      code: error.code,
      status: error.statusCode,
      cause: error,
    });
  }
  if (error instanceof HTTPException) {
    return new ApiError(publicMessageForStatus(error.status), {
      code: codeForStatus(error.status),
      status: error.status,
      cause: error,
    });
  }
  return new ApiError('An unexpected error occurred.', {
    code: ApiErrorCode.InternalError,
    status: HttpStatus.InternalServerError,
    cause: error,
  });
}

function publicMessageForStatus(status: number): string {
  if (status === HttpStatus.NotFound) return 'Resource not found.';
  if (status === HttpStatus.Unauthorized) return 'Authentication required.';
  if (status === HttpStatus.Forbidden) return 'Access denied.';
  if (status < HttpStatus.InternalServerError)
    return 'Request could not be processed.';
  return 'An unexpected error occurred.';
}

function codeForStatus(status: number): string {
  if (status === HttpStatus.NotFound) return ApiErrorCode.NotFound;
  if (status === HttpStatus.Unauthorized) return ApiErrorCode.Unauthorized;
  if (status === HttpStatus.Forbidden) return ApiErrorCode.Forbidden;
  if (status < HttpStatus.InternalServerError) return ApiErrorCode.BadRequest;
  return ApiErrorCode.InternalError;
}
