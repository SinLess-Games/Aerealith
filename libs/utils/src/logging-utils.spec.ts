import { describe, expect, it } from 'vitest';

import {
  calculateRecordSize,
  deepFreeze,
  generateId,
  isPlainObject,
  mergeRecords,
  normalizeRecord,
  safeJsonStringify,
  sanitizeLogContext,
  serializeError,
  shouldLog,
  truncate,
} from './index';

describe('logging and record utilities', () => {
  it('normalizes values and handles circular references', () => {
    const input: Record<string, unknown> = {
      bigint: 10n,
      date: new Date('2026-07-27T00:00:00.000Z'),
    };
    input['self'] = input;

    expect(normalizeRecord(input)).toMatchObject({
      bigint: '10',
      date: '2026-07-27T00:00:00.000Z',
      self: '[CIRCULAR]',
    });
  });

  it('redacts sensitive context before serialization', () => {
    expect(
      sanitizeLogContext({
        user: 'aerealith',
        api_key: 'secret-value',
      }),
    ).toEqual({
      user: 'aerealith',
      api_key: '[REDACTED]',
    });
  });

  it('serializes arbitrary errors and records safely', () => {
    const error = new Error('failed', { cause: { code: 42 } });

    expect(serializeError(error)).toMatchObject({
      name: 'Error',
      message: 'failed',
      cause: {
        name: 'NonErrorThrown',
        value: { code: 42 },
      },
    });
    expect(safeJsonStringify({ value: 1n })).toBe('{"value":"1"}');
  });

  it('calculates UTF-8 record size', () => {
    expect(calculateRecordSize({ message: 'é' })).toBe(
      new TextEncoder().encode('{"message":"é"}').byteLength,
    );
  });

  it('supports identifiers, levels, merging, truncation, and object checks', () => {
    expect(generateId('request')).toMatch(/^request_/);
    expect(shouldLog('info', 'error')).toBe(true);
    expect(shouldLog('info', 'debug')).toBe(false);
    expect(mergeRecords({ a: 1 }, undefined, { b: 2 })).toEqual({
      a: 1,
      b: 2,
    });
    expect(truncate('Aerealith', 5)).toBe('Aere…');
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject(new Date())).toBe(false);
  });

  it('deeply freezes cyclic object graphs', () => {
    const value: { nested: { enabled: boolean }; self?: unknown } = {
      nested: { enabled: true },
    };
    value.self = value;

    deepFreeze(value);

    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.nested)).toBe(true);
  });
});
