export const ApiErrorCode = {
  BadRequest: 'BAD_REQUEST',
  Unauthorized: 'UNAUTHORIZED',
  Forbidden: 'FORBIDDEN',
  NotFound: 'NOT_FOUND',
  ValidationFailed: 'VALIDATION_FAILED',
  InternalError: 'INTERNAL_ERROR',
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];
