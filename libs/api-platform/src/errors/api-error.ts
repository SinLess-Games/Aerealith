import { HttpStatus } from '@aerealith-ai/core';

import { ApiErrorCode } from './api-error-code.enum';

export interface ApiErrorOptions {
  readonly code?: string;
  readonly status?: number;
  readonly cause?: unknown;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly headers?: Readonly<Record<string, string>>;
}

/** Transport-neutral, public-safe API failure. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly headers?: Readonly<Record<string, string>>;
  readonly originalCause?: unknown;

  constructor(publicMessage: string, options: ApiErrorOptions = {}) {
    super(publicMessage);
    this.name = 'ApiError';
    this.code = options.code ?? ApiErrorCode.InternalError;
    this.status = options.status ?? HttpStatus.InternalServerError;
    this.metadata = options.metadata;
    this.headers = options.headers;
    this.originalCause = options.cause;
  }
}
