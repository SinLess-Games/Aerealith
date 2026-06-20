// libs/core/src/errors/aerealith.error.spec.ts

import { describe, expect, it } from 'vitest';

import { CommonErrorCode } from '../enumns';
import { AerealithError } from './aerealith.error';

describe('AerealithError', () => {
  it('extends Error', () => {
    const error = new AerealithError('Something went wrong.');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AerealithError);
  });

  it('uses safe defaults', () => {
    const error = new AerealithError('Something went wrong.');

    expect(error.name).toBe('AerealithError');
    expect(error.message).toBe('Something went wrong.');
    expect(error.code).toBe(CommonErrorCode.INTERNAL_ERROR);
    expect(error.statusCode).toBe(500);
    expect(error.details).toBeUndefined();
    expect(error.originalCause).toBeUndefined();
  });

  it('preserves custom error options', () => {
    const cause = new Error('Database connection failed.');
    const details = {
      field: 'email',
      reason: 'already exists',
    };

    const error = new AerealithError('User already exists.', {
      code: CommonErrorCode.CONFLICT,
      statusCode: 409,
      details,
      cause,
    });

    expect(error.code).toBe(CommonErrorCode.CONFLICT);
    expect(error.statusCode).toBe(409);
    expect(error.details).toEqual(details);
    expect(error.originalCause).toBe(cause);
  });

  it('identifies client errors', () => {
    const error = new AerealithError('Invalid request.', {
      statusCode: 400,
    });

    expect(error.isClientError).toBe(true);
    expect(error.isServerError).toBe(false);
  });

  it('identifies server errors', () => {
    const error = new AerealithError('Internal server error.', {
      statusCode: 500,
    });

    expect(error.isClientError).toBe(false);
    expect(error.isServerError).toBe(true);
  });

  it('does not classify successful status codes as client or server errors', () => {
    const error = new AerealithError('Unexpected status.', {
      statusCode: 200,
    });

    expect(error.isClientError).toBe(false);
    expect(error.isServerError).toBe(false);
  });

  it('matches its error code', () => {
    const error = new AerealithError('Conflict.', {
      code: CommonErrorCode.CONFLICT,
      statusCode: 409,
    });

    expect(error.hasCode(CommonErrorCode.CONFLICT)).toBe(true);
    expect(error.hasCode(CommonErrorCode.INTERNAL_ERROR)).toBe(false);
  });

  it('serializes safe error data', () => {
    const cause = new Error('Sensitive internal failure.');
    const details = {
      field: 'email',
    };

    const error = new AerealithError('Email is already in use.', {
      code: CommonErrorCode.CONFLICT,
      statusCode: 409,
      details,
      cause,
    });

    expect(error.toJSON()).toEqual({
      name: 'AerealithError',
      message: 'Email is already in use.',
      code: CommonErrorCode.CONFLICT,
      statusCode: 409,
      details,
    });
  });

  it('does not expose the original cause in serialized output', () => {
    const error = new AerealithError('Internal failure.', {
      cause: new Error('Sensitive database error.'),
    });

    expect(error.toJSON()).not.toHaveProperty('originalCause');
    expect(error.toJSON()).not.toHaveProperty('cause');
    expect(error.toJSON()).not.toHaveProperty('stack');
  });
});
