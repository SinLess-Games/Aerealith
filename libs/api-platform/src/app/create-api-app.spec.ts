import { createMiddleware } from 'hono/factory';
import { describe, expect, it, vi } from 'vitest';

import type { ApiRequestContext } from '../context/api-request-context.interface';
import { ApiError } from '../errors/api-error';
import { ApiErrorCode } from '../errors/api-error-code.enum';
import { TestLogger } from '../testing/test-logger';
import { mountHttpRoutes } from '../transports/http';
import type { ApiEnv } from './api-env.type';
import { createApiApp } from './create-api-app';

type Principal = { id: string };
type TestContext = ApiRequestContext<Principal> & { dependency: string };
type TestEnv = ApiEnv<TestContext>;

describe('createApiApp', () => {
  it('creates context once and propagates request headers and principal', async () => {
    const logger = new TestLogger();
    const resolvePrincipal = vi.fn(() => ({ id: 'user-1' }));
    const createContext = vi.fn((base: ApiRequestContext<Principal>) => ({
      ...base,
      dependency: 'ready',
    }));
    const app = createApiApp<TestEnv>({
      serviceName: 'test',
      logger,
      resolvePrincipal,
      createContext,
    });
    app.get('/context', (context) => context.json(context.get('apiContext')));

    const response = await app.request('/context', {
      headers: {
        'x-correlation-id': 'correlation-1',
        'x-request-id': 'request-1',
      },
    });
    const body = (await response.json()) as TestContext;

    expect(body.requestId).toBe('request-1');
    expect(body.correlationId).toBe('correlation-1');
    expect(body.principal).toEqual({ id: 'user-1' });
    expect(body.dependency).toBe('ready');
    expect(response.headers.get('x-request-id')).toBe('request-1');
    expect(response.headers.get('x-correlation-id')).toBe('correlation-1');
    expect(resolvePrincipal).toHaveBeenCalledOnce();
    expect(createContext).toHaveBeenCalledOnce();
    expect(logger.childContexts[0]).toMatchObject({
      requestId: 'request-1',
      correlationId: 'correlation-1',
      method: 'GET',
      route: '/context',
      serviceName: 'test',
    });
  });

  it('generates a request ID', async () => {
    const app = createApiApp<ApiEnv>({
      serviceName: 'test',
      logger: new TestLogger(),
    });
    app.get('/ok', (context) => context.json({ ok: true }));
    const response = await app.request('/ok');
    expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/u);
  });

  it('mounts HTTP routes and normalizes errors', async () => {
    const app = createApiApp<ApiEnv>({
      serviceName: 'test',
      logger: new TestLogger(),
    });
    mountHttpRoutes(app, {
      basePath: '/api/v1',
      register(router) {
        router.get('/success', (context) => context.json({ ok: true }));
        router.get('/failure', () => {
          throw new ApiError('Safe failure.', {
            code: ApiErrorCode.BadRequest,
            status: 400,
          });
        });
      },
    });

    const success = await app.request('/api/v1/success');
    expect(success.status).toBe(200);
    await expect(success.json()).resolves.toEqual({ ok: true });

    const failure = await app.request('/api/v1/failure', {
      headers: { 'x-request-id': 'error-request' },
    });
    expect(failure.status).toBe(400);
    await expect(failure.json()).resolves.toEqual({
      error: {
        code: 'BAD_REQUEST',
        message: 'Safe failure.',
        requestId: 'error-request',
      },
    });
  });

  it('supports health paths, base paths, and excluded optional middleware', async () => {
    const middleware = vi.fn();
    const app = createApiApp<ApiEnv>({
      serviceName: 'test',
      logger: new TestLogger(),
      basePath: '/service',
      health: {
        path: '/live',
        readinessPath: '/ready-custom',
      },
      middleware: [
        {
          exclude: ['/service/socket'],
          handler: createMiddleware(async (context, next) => {
            middleware(context.req.path);
            context.header('x-middleware', 'applied');
            await next();
          }),
        },
      ],
    });
    app.get('/socket/connect', (context) => context.text('upgrade'));

    const health = await app.request('/service/live');
    expect(await health.json()).toEqual({ service: 'test', status: 'ok' });
    expect(health.headers.get('x-middleware')).toBe('applied');

    const readiness = await app.request('/service/ready-custom');
    expect(await readiness.json()).toEqual({
      service: 'test',
      status: 'ready',
    });

    const socket = await app.request('/service/socket/connect');
    expect(socket.headers.get('x-middleware')).toBeNull();
    expect(middleware).toHaveBeenCalledTimes(2);
  });

  it('reports dependency readiness without exposing failure details', async () => {
    const app = createApiApp<ApiEnv>({
      serviceName: 'test',
      logger: new TestLogger(),
      health: {
        checkReadiness: vi.fn().mockRejectedValue(new Error('db password')),
      },
    });

    const response = await app.request('/ready');
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      service: 'test',
      status: 'not_ready',
    });
  });

  it('returns standard not-found envelopes', async () => {
    const app = createApiApp<ApiEnv>({
      serviceName: 'test',
      logger: new TestLogger(),
    });
    const response = await app.request('/missing', {
      headers: { 'x-request-id': 'not-found-request' },
    });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found.',
        requestId: 'not-found-request',
      },
    });
  });

  it('logs request failures and masks unknown errors', async () => {
    const logger = new TestLogger();
    const app = createApiApp<ApiEnv>({
      serviceName: 'test',
      logger,
    });
    app.get('/failure', () => {
      throw new Error('private database detail');
    });
    const response = await app.request('/failure', {
      headers: { 'x-request-id': 'failed-request' },
    });
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('private database detail');
    expect(
      logger.records.filter((record) => record.event === 'api.request.failed'),
    ).toHaveLength(1);
  });

  it('does not mutate WebSocket upgrade response headers', async () => {
    const app = createApiApp<ApiEnv>({
      serviceName: 'test',
      logger: new TestLogger(),
    });
    app.get('/ws', (context) => context.text('upgrade'));
    const response = await app.request('/ws', {
      headers: {
        upgrade: 'websocket',
        'x-request-id': 'websocket-request',
      },
    });
    expect(response.headers.get('x-request-id')).toBeNull();
  });
});
