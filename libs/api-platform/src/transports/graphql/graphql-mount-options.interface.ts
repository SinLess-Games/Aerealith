import type { GraphQLSchema } from 'graphql';
import type { Plugin } from 'graphql-yoga';
import type { Context } from 'hono';

import type { ApiEnv } from '../../app/api-env.type';
import type { MaybePromise } from '../../context/api-context-factory.interface';

export interface GraphqlMountOptions<
  TEnv extends ApiEnv,
  TGraphqlContext extends Record<string, unknown>,
> {
  readonly path?: string;
  readonly schema: GraphQLSchema;
  readonly createContext: (
    shared: TEnv['Variables']['apiContext'],
    honoContext: Context<TEnv>,
  ) => MaybePromise<TGraphqlContext>;
  readonly graphiql?: boolean;
  readonly maskErrors?: boolean;
  readonly plugins?: readonly Plugin[];
}
