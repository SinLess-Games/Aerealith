import {
  type ApiRequestObserver,
  createApiApp,
  mountGraphql,
  mountHttpRoutes,
  mountTrpc,
} from '@aerealith-ai/api-platform';
import { ApiRoute, type Logger } from '@aerealith-ai/core';
import type { AuthorizationService } from '@aerealith-ai/authorization';
import {
  createLogger,
  type OperationObserver,
} from '@aerealith-ai/observability';
import type { MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';

import type { AuthApplication } from './auth/auth-application.service';
import type {
  AuthApiContext,
  AuthApiEnv,
  AuthTransportContext,
} from './auth/auth-api-context';
import { createAuthGraphqlSchema } from './auth/auth-graphql.schema';
import { registerAuthHttpRoutes } from './auth/auth-http.routes';
import { createAuthTrpcRouter } from './auth/auth-trpc.router';
import { LazyAuthApplication } from './auth/lazy-auth-application';
import { LazyAuthorizationService } from './auth/lazy-authorization.service';
import { ObservableAuthApplication } from './auth/observable-auth-application';
import { requireTrustedOrigin } from './auth/origin-protection.middleware';

export interface CreateAuthServiceAppOptions {
  readonly application?: AuthApplication;
  readonly authorization?: AuthorizationService;
  readonly logger?: Logger;
  readonly environment?: string;
  readonly enableGraphiql?: boolean;
  readonly operationObserver?: OperationObserver;
  readonly requestObserver?: ApiRequestObserver;
  readonly readinessCheck?: () => Promise<void>;
  /** Explicit cross-origin browser origins, if the service is not proxied. */
  readonly allowedOrigins?: readonly string[];
}

export function createAuthServiceApp(
  options: CreateAuthServiceAppOptions = {},
) {
  const allowedOrigins = new Set(options.allowedOrigins ?? []);
  const credentialedCors = createCredentialedCors(allowedOrigins);
  const baseApplication = options.application ?? new LazyAuthApplication();
  const application = options.operationObserver
    ? new ObservableAuthApplication(baseApplication, options.operationObserver)
    : baseApplication;
  const authorization = options.authorization ?? new LazyAuthorizationService();
  const logger =
    options.logger ??
    createLogger({
      service: 'auth',
      environment:
        options.environment ?? process.env['NODE_ENV'] ?? 'development',
    });

  const app = createApiApp<AuthApiEnv>({
    serviceName: 'auth',
    logger,
    health: {
      checkReadiness: options.readinessCheck,
    },
    requestObserver: options.requestObserver,
    createContext(base): AuthApiContext {
      return { ...base, auth: application, authorization };
    },
    middleware: [
      ...(allowedOrigins.size > 0
        ? [
            {
              handler: credentialedCors,
            },
          ]
        : []),
      {
        handler: requireTrustedOrigin(options.allowedOrigins),
      },
    ],
  });

  mountHttpRoutes(app, {
    basePath: ApiRoute,
    register(router) {
      registerAuthHttpRoutes(router, application);
      router.get('/services/auth', (context) =>
        context.json({ service: 'auth', status: 'ok' }),
      );
    },
  });

  const trpcRouter = createAuthTrpcRouter(application);
  mountTrpc(app, {
    path: '/trpc',
    router: trpcRouter,
    createContext(apiContext, honoContext): AuthTransportContext {
      return { apiContext, honoContext };
    },
  });

  mountGraphql(app, {
    path: '/graphql',
    schema: createAuthGraphqlSchema(application),
    createContext(apiContext, honoContext): AuthTransportContext {
      return { apiContext, honoContext };
    },
    graphiql:
      options.enableGraphiql ??
      (options.environment ?? process.env['NODE_ENV']) !== 'production',
  });

  return app;
}

function createCredentialedCors(
  allowedOrigins: ReadonlySet<string>,
): MiddlewareHandler<AuthApiEnv> {
  const handler = cors({
    origin: (origin) => (allowedOrigins.has(origin) ? origin : ''),
    allowMethods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'X-CSRF-Token',
      'X-Request-ID',
    ],
    exposeHeaders: ['Content-Length', 'Content-Type', 'X-Request-ID'],
    maxAge: 86_400,
  });

  return async (context, next) => {
    const response = await handler(context, next);
    if (allowedOrigins.has(context.req.header('origin') ?? '')) {
      context.res.headers.set('Access-Control-Allow-Credentials', 'true');
      if (response) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
    }
    return response;
  };
}
