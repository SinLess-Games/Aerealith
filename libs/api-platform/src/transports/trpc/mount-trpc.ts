import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { AnyRouter } from '@trpc/server';
import type { Hono } from 'hono';

import type { ApiEnv } from '../../app/api-env.type';
import type { TrpcMountOptions } from './trpc-mount-options.interface';

/** Mounts tRPC's Fetch adapter into the existing Hono application. */
export function mountTrpc<TEnv extends ApiEnv, TRouter extends AnyRouter>(
  app: Hono<TEnv>,
  options: TrpcMountOptions<TEnv, TRouter>,
): Hono<TEnv> {
  const path = normalizePath(options.path ?? '/trpc');
  app.all(`${path}/*`, async (honoContext) => {
    const response = await fetchRequestHandler({
      endpoint: path,
      req: honoContext.req.raw,
      router: options.router,
      createContext: () =>
        options.createContext(honoContext.get('apiContext'), honoContext),
      onError({ error, path: procedurePath, type }) {
        honoContext.get('apiContext').logger.error({
          event: 'api.trpc.request.failed',
          message: 'tRPC request failed.',
          component: 'api-platform',
          error,
          context: {
            operation: procedurePath,
            procedureType: type,
            transport: 'trpc',
          },
        });
      },
    });
    return maskInternalTrpcError(response);
  });
  return app;
}

async function maskInternalTrpcError(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object') return response;
  const record = body as Record<string, unknown>;
  const error = record['error'];
  if (!error || typeof error !== 'object') return response;
  const errorRecord = error as Record<string, unknown>;
  errorRecord['message'] = 'An unexpected error occurred.';
  const data = errorRecord['data'];
  if (data && typeof data === 'object') {
    delete (data as Record<string, unknown>)['stack'];
  }
  return Response.json(record, {
    status: response.status,
    headers: response.headers,
  });
}

function normalizePath(path: string): string {
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return withLeadingSlash.replace(/\/+$/u, '');
}
