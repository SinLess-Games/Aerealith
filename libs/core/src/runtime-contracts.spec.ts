import { describe, expect, it } from 'vitest';

import {
  ApiDomain,
  ApiRoute,
  ApiVersion,
  AuthPort,
  AuthRoute,
  AuthService,
  HealthRoute,
  HttpErrorCode,
  LogLevel,
  MailDomain,
  NoopLogger,
  PrimaryDomain,
  ServiceHealthStatus,
  ServiceNames,
  ServicePorts,
  StatusUrls,
  ThirdPartyStatusUrls,
  UserPort,
  UserService,
  assertNever,
  getHttpError,
  getHttpErrorByStatus,
  isDefined,
  noopLogger,
} from './index';

describe('core runtime contracts', () => {
  it('composes canonical domains, routes, services, and status URLs', () => {
    expect(MailDomain).toBe(`mail.${PrimaryDomain}`);
    expect(ApiDomain).toBe(`api.${PrimaryDomain}`);
    expect(ApiRoute).toBe(`/api/${ApiVersion}`);
    expect(AuthRoute).toBe(`${ApiRoute}/auth`);
    expect(HealthRoute).toBe('/health');
    expect(ServiceNames).toContain(AuthService);
    expect(ServiceNames).toContain(UserService);
    expect(ServicePorts[AuthService]).toBe(AuthPort);
    expect(ServicePorts[UserService]).toBe(UserPort);
    expect(StatusUrls.production.auth).toContain(ApiDomain);
    expect(StatusUrls.local.auth).toBe(`http://localhost:${AuthPort}/health`);
    expect(new URL(ThirdPartyStatusUrls.cloudflare).protocol).toBe('https:');
  });

  it('defines distinct service health states', () => {
    expect(Object.values(ServiceHealthStatus)).toEqual([
      'healthy',
      'degraded',
      'unhealthy',
    ]);
  });

  it('looks up complete HTTP error definitions by key and status', () => {
    expect(getHttpError('NOT_FOUND')).toEqual(HttpErrorCode.NOT_FOUND);
    expect(getHttpErrorByStatus(404)).toEqual({
      statusCode: 404,
      reason: 'Not Found',
      meaning: 'The requested resource does not exist.',
    });
    expect(getHttpErrorByStatus(499 as never)).toBeUndefined();
  });

  it('provides a reusable logger that safely discards every level', async () => {
    const logger: typeof noopLogger = new NoopLogger();
    const input = { event: 'test', message: 'Test' };

    expect(logger.trace(input)).toBeUndefined();
    expect(logger.debug(input)).toBeUndefined();
    expect(logger.info(input)).toBeUndefined();
    expect(logger.warn(input)).toBeUndefined();
    expect(logger.error(input)).toBeUndefined();
    expect(logger.fatal(input)).toBeUndefined();
    expect(logger.child({ requestId: 'request-1' })).toBe(logger);
    await expect(logger.flush()).resolves.toBeUndefined();
    await expect(logger.close()).resolves.toBeUndefined();
    expect(Object.isFrozen(noopLogger)).toBe(true);
    expect(Object.values(LogLevel)).toEqual([
      'trace',
      'debug',
      'info',
      'warn',
      'error',
      'fatal',
    ]);
  });

  it('filters defined values and reports impossible runtime branches', () => {
    expect([1, null, 2, undefined].filter(isDefined)).toEqual([1, 2]);
    expect(() =>
      assertNever('unexpected' as never, 'Impossible branch.'),
    ).toThrow('Impossible branch.');
  });
});
