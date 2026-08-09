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

export interface CreateAuthServiceAppOptions {
  readonly application?: AuthApplication;
  readonly authorization?: AuthorizationService;
  readonly logger?: Logger;
  readonly environment?: string;
  readonly enableGraphiql?: boolean;
  readonly operationObserver?: OperationObserver;
  readonly requestObserver?: ApiRequestObserver;
  readonly readinessCheck?: () => Promise<void>;
}

export function createAuthServiceApp(
  options: CreateAuthServiceAppOptions = {},
) {
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

  // Preserve the original lowercase scaffold route while clients migrate to
  // the shared core route constants.
  mountHttpRoutes(app, {
    basePath: '/api/v1',
    register(router) {
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
