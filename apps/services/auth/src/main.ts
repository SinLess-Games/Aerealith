import {
  createApiApp,
  mountHttpRoutes,
  type ApiEnv,
} from '@aerealith-ai/api-platform';
import { noopLogger } from '@aerealith-ai/core';

const app = createApiApp<ApiEnv>({
  serviceName: 'auth',
  logger: noopLogger,
});

mountHttpRoutes(app, {
  basePath: '/api/v1',
  register(router) {
    router.get('/services/auth', (context) =>
      context.json({ service: 'auth', status: 'ok' }),
    );
  },
});

export default app;
