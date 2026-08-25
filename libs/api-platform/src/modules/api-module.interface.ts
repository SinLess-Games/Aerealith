import type { AnyRouter } from '@trpc/server';

import type { ApiEnv } from '../app/api-env.type';
import type { GraphqlMountOptions } from '../transports/graphql';
import type { HttpRouteRegistrar } from '../transports/http';
import type { TrpcMountOptions } from '../transports/trpc';
import type { WebSocketAdapter, WebSocketRoute } from '../transports/websocket';

export interface ApiModule<TEnv extends ApiEnv> {
  readonly name: string;
  readonly registerHttp?: HttpRouteRegistrar<TEnv>;
  readonly httpBasePath?: string;
  readonly trpc?: TrpcMountOptions<TEnv, AnyRouter>;
  readonly graphql?: GraphqlMountOptions<TEnv, Record<string, unknown>>;
  readonly webSockets?: {
    readonly adapter: WebSocketAdapter<TEnv>;
    readonly routes: readonly WebSocketRoute<
      TEnv['Variables']['apiContext'],
      unknown
    >[];
  };
}
