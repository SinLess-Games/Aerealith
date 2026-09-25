import { recordWorkerRequest } from '@aerealith-ai/observability/worker';

import app, {
  createApiServiceApp,
  type ApiWorkerBindings,
} from './main';

export { app, createApiServiceApp };

export default {
  async fetch(
    request: Request,
    environment: ApiWorkerBindings,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    const startedAt = performance.now();

    try {
      const response = await app.fetch(request, environment, executionContext);
      recordWorkerRequest({
        service: 'api',
        request,
        status: response.status,
        durationMs: performance.now() - startedAt,
        analytics: environment.AEREALITH_ANALYTICS,
      });
      return response;
    } catch (error) {
      recordWorkerRequest({
        service: 'api',
        request,
        status: 500,
        durationMs: performance.now() - startedAt,
        error,
        analytics: environment.AEREALITH_ANALYTICS,
      });
      throw error;
    }
  },
};
