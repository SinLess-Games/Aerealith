import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CIRCULAR_REPLACEMENT,
  DEFAULT_MAX_DEPTH_REPLACEMENT,
  DEFAULT_REDACTION_REPLACEMENT,
  deepFreeze,
  generateId,
  isPlainObject,
  mergeRecords,
  normalizeRecord,
  redact,
  redactRecord,
  safeJsonStringify,
  sanitizeLogContext,
  serializeError,
  shouldLog,
  truncate,
} from './index';

describe('logging utility edge cases', () => {
  it('redacts separator-insensitive keys across objects, maps, sets, arrays, and errors', () => {
    const error = new Error('failed', {
      cause: { access_token: 'secret' },
    }) as Error & {
      apiKey: string;
    };
    error.apiKey = 'secret';
    const value: Record<string, unknown> = {
      ACCESS_TOKEN: 'secret',
      customSecret: 'secret',
      error,
      map: new Map([
        ['password', 'secret'],
        ['safe', 'value'],
      ]),
      set: new Set(['one']),
      array: [{ sessionToken: 'secret' }],
      date: new Date('2026-08-13T12:00:00.000Z'),
      regexp: /secret/giu,
      symbol: Symbol('marker'),
      callback() {
        return undefined;
      },
    };
    value['self'] = value;

    expect(
      redact(value, {
        sensitiveKeys: ['custom-secret'],
        replacement: '<hidden>',
      }),
    ).toMatchObject({
      ACCESS_TOKEN: '<hidden>',
      customSecret: '<hidden>',
      error: { apiKey: '<hidden>', cause: { access_token: '<hidden>' } },
      map: { password: '<hidden>', safe: 'value' },
      set: ['one'],
      array: [{ sessionToken: '<hidden>' }],
      date: '2026-08-13T12:00:00.000Z',
      regexp: '/secret/giu',
      symbol: 'Symbol(marker)',
      self: DEFAULT_CIRCULAR_REPLACEMENT,
    });
  });

  it('supports custom circular and depth markers without mutating input', () => {
    const input = { nested: { secret: 'value' } };
    const redacted = redact(input, {
      maxDepth: 0,
      circularReplacement: '<cycle>',
      maxDepthReplacement: '<deep>',
    });

    expect(redacted).toEqual({ nested: '<deep>' });
    expect(input.nested.secret).toBe('value');
    expect(DEFAULT_REDACTION_REPLACEMENT).toBe('[REDACTED]');
    expect(DEFAULT_MAX_DEPTH_REPLACEMENT).toBe('[MAX_DEPTH]');
  });

  it('normalizes every supported record value family', () => {
    const error = new Error('failed', { cause: 'root' }) as Error & {
      code: number;
    };
    error.code = 42;
    const record: Record<string, unknown> = {
      number: Number.NaN,
      bigint: 2n,
      undefined,
      symbol: Symbol('marker'),
      named: function named() {
        return undefined;
      },
      anonymous: () => undefined,
      validDate: new Date('2026-08-13T12:00:00.000Z'),
      invalidDate: new Date(Number.NaN),
      regexp: /test/u,
      error,
      array: [1, undefined],
      map: new Map([[1, 'one']]),
      set: new Set(['one']),
    };
    record['self'] = record;

    expect(normalizeRecord(record)).toMatchObject({
      number: 'NaN',
      bigint: '2',
      undefined: '[UNDEFINED]',
      symbol: 'Symbol(marker)',
      named: '[Function: named]',
      validDate: '2026-08-13T12:00:00.000Z',
      invalidDate: 'Invalid Date',
      regexp: '/test/u',
      error: { name: 'Error', message: 'failed', cause: 'root', code: 42 },
      array: [1, '[UNDEFINED]'],
      map: { '1': 'one' },
      set: ['one'],
      self: '[CIRCULAR]',
    });
  });

  it('stringifies cycles, errors, maps, sets, bigint options, and failures safely', () => {
    const cyclic: Record<string, unknown> = { value: 1n };
    cyclic['self'] = cyclic;
    expect(
      safeJsonStringify(cyclic, {
        indentation: 20,
        circularReplacement: '<cycle>',
        bigintAsString: false,
      }),
    ).toContain('"self": "<cycle>"');
    expect(
      JSON.parse(
        safeJsonStringify({
          error: new Error('failed'),
          map: new Map([['key', 'value']]),
          set: new Set(['one']),
        }),
      ),
    ).toMatchObject({
      error: { name: 'Error', message: 'failed' },
      map: { key: 'value' },
      set: ['one'],
    });

    const throwing = {
      toJSON() {
        throw new Error('cannot serialize');
      },
    };
    expect(safeJsonStringify(throwing)).toBe('"[UNSERIALIZABLE]"');
    expect(safeJsonStringify(undefined)).toBe('null');
  });

  it('serializes error codes, causes, and arbitrary thrown values', () => {
    const error = new Error('outer', { cause: new Error('inner') }) as Error & {
      code: string;
    };
    error.code = 'E_OUTER';
    expect(serializeError(error)).toMatchObject({
      name: 'Error',
      message: 'outer',
      code: 'E_OUTER',
      cause: { name: 'Error', message: 'inner' },
    });
    expect(serializeError('failed')).toEqual({
      name: 'NonErrorThrown',
      message: 'failed',
      value: 'failed',
    });
    expect(serializeError(42)).toEqual({
      name: 'NonErrorThrown',
      message: 'A non-Error value was thrown',
      value: 42,
    });
  });

  it('handles truncation boundaries and invalid maximum lengths', () => {
    expect(truncate('Aerealith', 20)).toBe('Aerealith');
    expect(truncate('Aerealith', 0)).toBe('');
    expect(truncate('Aerealith', 2, '...')).toBe('..');
    expect(() => truncate('Aerealith', -1)).toThrow(RangeError);
    expect(() => truncate('Aerealith', 1.5)).toThrow(RangeError);
  });

  it('freezes symbols and functions while leaving primitives unchanged', () => {
    const symbol = Symbol('child');
    const callable = Object.assign(() => undefined, {
      [symbol]: { nested: true },
    });
    expect(deepFreeze(callable)).toBe(callable);
    expect(Object.isFrozen(callable)).toBe(true);
    expect(Object.isFrozen(callable[symbol])).toBe(true);
    expect(deepFreeze(42)).toBe(42);
  });

  it('covers record, identifier, level, and object helper boundaries', () => {
    expect(redactRecord({ token: 'secret' })).toEqual({ token: '[REDACTED]' });
    expect(redactRecord([] as unknown as Record<string, unknown>)).toEqual({
      value: [],
    });
    expect(sanitizeLogContext({ nested: { password: 'secret' } })).toEqual({
      nested: { password: '[REDACTED]' },
    });
    expect(generateId('  request  ')).toMatch(/^request_/u);
    expect(generateId()).not.toContain('undefined_');
    expect(mergeRecords(undefined, { one: 1 }, undefined, { one: 2 })).toEqual({
      one: 2,
    });
    expect(shouldLog('warn', 'info')).toBe(false);
    expect(shouldLog('warn', 'fatal')).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(null)).toBe(false);
  });
});
