// libs/core/src/errors/throw-error.spec.ts

import { describe, expect, it } from 'vitest';

import { CommonErrorCode } from '../enumns';
import { AerealithError } from './aerealith.error';
import { throwError } from './throw-error';

describe('throwError', () => {
  it('throws an AerealithError', () => {
    expect(() => {
      throwError('Something went wrong.');
    }).toThrow(AerealithError);
  });

  it('throws with the provided message', () => {
    expect(() => {
      throwError('Custom failure message.');
    }).toThrow('Custom failure message.');
  });

  it('uses safe defaults', () => {
    try {
      throwError('Something went wrong.');
    } catch (error) {
      expect(error).toBeInstanceOf(AerealithError);

      const aerealithError = error as AerealithError;

      expect(aerealithError.name).toBe('AerealithError');
      expect(aerealithError.message).toBe('Something went wrong.');
      expect(aerealithError.code).toBe(CommonErrorCode.INTERNAL_ERROR);
      expect(aerealithError.statusCode).toBe(500);
      expect(aerealithError.details).toBeUndefined();
      expect(aerealithError.originalCause).toBeUndefined();
    }
  });

  it('throws with custom error options', () => {
    const cause = new Error('Original failure.');
    const details = {
      field: 'email',
      reason: 'already exists',
    };

    try {
      throwError('Email already exists.', {
        code: CommonErrorCode.CONFLICT,
        statusCode: 409,
        details,
        cause,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(AerealithError);

      const aerealithError = error as AerealithError;

      expect(aerealithError.message).toBe('Email already exists.');
      expect(aerealithError.code).toBe(CommonErrorCode.CONFLICT);
      expect(aerealithError.statusCode).toBe(409);
      expect(aerealithError.details).toEqual(details);
      expect(aerealithError.originalCause).toBe(cause);
    }
  });

  it('never returns a value', () => {
    expect(() => {
      const result = throwError('This should throw.');

      expect(result).toBeUndefined();
    }).toThrow(AerealithError);
  });
});
