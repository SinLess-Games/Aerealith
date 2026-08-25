import type { Logger } from '@aerealith-ai/core';
import type { MiddlewareHandler } from 'hono';

import type {
  ApiContextFactory,
  ResolvePrincipal,
} from '../context/api-context-factory.interface';
import type { ApiRequestContext } from '../context/api-request-context.interface';
import type { ApiRequestObserver } from '../observability/api-request-observer.interface';
import type { ApiEnv } from './api-env.type';

export interface ApiMiddlewareRegistration<TEnv extends ApiEnv> {
  readonly handler: MiddlewareHandler<TEnv>;
  readonly exclude?: readonly string[];
}

export interface ApiHealthOptions {
  readonly path?: string;
  readonly readinessPath?: string;
  readonly checkReadiness?: () => Promise<void>;
}

/** Configuration shared by every Aerealith Hono service. */
export interface ApiAppOptions<
  TEnv extends ApiEnv,
  TContext extends ApiRequestContext = TEnv['Variables']['apiContext'],
> {
  readonly serviceName: string;
  readonly logger: Logger;
  readonly basePath?: string;
  readonly createContext?: ApiContextFactory<TEnv, TContext>;
  readonly resolvePrincipal?: ResolvePrincipal<
    NonNullable<TContext['principal']>
  >;
  readonly middleware?: readonly ApiMiddlewareRegistration<TEnv>[];
  readonly health?: boolean | ApiHealthOptions;
  readonly requestIdHeader?: string;
  readonly correlationIdHeader?: string;
  readonly requestObserver?: ApiRequestObserver;
}
