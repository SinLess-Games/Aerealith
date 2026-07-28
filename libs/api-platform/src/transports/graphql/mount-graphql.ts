import type { ExecutionResult } from 'graphql';
import { createYoga, type Plugin } from 'graphql-yoga';
import type { Hono } from 'hono';

import type { ApiEnv } from '../../app/api-env.type';
import type { ApiRequestContext } from '../../context/api-request-context.interface';
import type { GraphqlMountOptions } from './graphql-mount-options.interface';

/** Constructs GraphQL Yoga once and mounts its Fetch handler into Hono. */
export function mountGraphql<
  TEnv extends ApiEnv,
  TGraphqlContext extends Record<string, unknown>,
>(
  app: Hono<TEnv>,
  options: GraphqlMountOptions<TEnv, TGraphqlContext>,
): Hono<TEnv> {
  const path = normalizePath(options.path ?? '/graphql');
  const yoga = createYoga<
    { apiContext: TEnv['Variables']['apiContext']; honoContext: unknown },
    TGraphqlContext
  >({
    schema: options.schema,
    graphqlEndpoint: path,
    graphiql: options.graphiql ?? false,
    maskedErrors: options.maskErrors ?? true,
    plugins: [
      createGraphqlErrorLoggingPlugin(),
      ...(options.plugins ? [...options.plugins] : []),
    ],
    logging: false,
    context: ({ apiContext, honoContext }) =>
      options.createContext(apiContext, honoContext as never),
  });

  app.all(path, async (honoContext) => {
    try {
      return await yoga.fetch(honoContext.req.raw, {
        apiContext: honoContext.get('apiContext'),
        honoContext,
      });
    } catch (error) {
      honoContext.get('apiContext').logger.error({
        event: 'api.graphql.request.failed',
        message: 'GraphQL request failed.',
        component: 'api-platform',
        error,
        context: { transport: 'graphql' },
      });
      throw error;
    }
  });
  return app;
}

function createGraphqlErrorLoggingPlugin(): Plugin {
  return {
    onExecute() {
      return {
        onExecuteDone({ args, result }) {
          const context = (
            args.contextValue as { apiContext?: ApiRequestContext }
          ).apiContext;
          const operation = args.operationName?.value;
          if (isAsyncIterable(result)) {
            return {
              onNext({ result: nextResult }) {
                logExecutionErrors(nextResult, context, operation);
              },
            };
          }
          logExecutionErrors(result as ExecutionResult, context, operation);
          return undefined;
        },
      };
    },
  };
}

function logExecutionErrors(
  result: ExecutionResult,
  context: ApiRequestContext | undefined,
  operation: string | undefined,
): void {
  if (!result.errors?.length || !context) return;
  context.logger.error({
    event: 'api.graphql.request.failed',
    message: 'GraphQL execution failed.',
    component: 'api-platform',
    error: result.errors[0]?.originalError,
    context: {
      errorCount: result.errors.length,
      operation,
      transport: 'graphql',
    },
  });
}

function isAsyncIterable(
  value: ExecutionResult | AsyncIterable<ExecutionResult>,
): value is AsyncIterable<ExecutionResult> {
  return Symbol.asyncIterator in value;
}

function normalizePath(path: string): string {
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return withLeadingSlash.replace(/\/+$/u, '');
}
