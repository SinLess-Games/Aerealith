// libs/db/src/utils/database-error.mapper.ts

import {
  AerealithError,
  CommonErrorCode,
  HttpErrorCode,
} from '@aerealith-ai/core';

type DatabaseErrorLike = {
  code?: unknown;
  constraint?: unknown;
  message?: unknown;
};

const PostgresErrorCode = {
  ForeignKeyViolation: '23503',
  UniqueViolation: '23505',
} as const;

/**
 * Converts a database error into a safe application error.
 *
 * Database driver details stay internal. API responses should use the
 * resulting AerealithError instead of returning raw database messages.
 */
export function mapDatabaseError(error: unknown): AerealithError {
  if (error instanceof AerealithError) {
    return error;
  }

  const databaseError = getDatabaseError(error);

  if (databaseError?.code === PostgresErrorCode.UniqueViolation) {
    return new AerealithError('A record with this value already exists.', {
      code: CommonErrorCode.CONFLICT,
      statusCode: HttpErrorCode.CONFLICT.statusCode,
      details: {
        constraint: databaseError.constraint,
      },
      cause: error,
    });
  }

  if (databaseError?.code === PostgresErrorCode.ForeignKeyViolation) {
    return new AerealithError(
      'The requested record references data that does not exist.',
      {
        code: CommonErrorCode.CONFLICT,
        statusCode: HttpErrorCode.CONFLICT.statusCode,
        details: {
          constraint: databaseError.constraint,
        },
        cause: error,
      },
    );
  }

  return new AerealithError('A database operation failed.', {
    code: CommonErrorCode.INTERNAL_ERROR,
    statusCode: HttpErrorCode.INTERNAL_SERVER_ERROR.statusCode,
    details: {
      databaseCode: databaseError?.code,
    },
    cause: error,
  });
}

function getDatabaseError(error: unknown): DatabaseErrorLike | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  return error as DatabaseErrorLike;
}
