import { recordWorkerRequest } from '@aerealith-ai/observability/worker';

import app, {
  AiCodeSandbox,
  AiConversationIndex,
  AiConversationState,
  AiKnowledgeCatalog,
  AiOrchestrationWorkflow,
  AiRateLimit,
  AiRunIndex,
  AiRunState,
  AiUsageLedger,
} from './main';
import type { AiOrchestratorBindings } from './bindings';

export {
  AiCodeSandbox,
  AiConversationIndex,
  AiConversationState,
  AiKnowledgeCatalog,
  AiOrchestrationWorkflow,
  AiRateLimit,
  AiRunIndex,
  AiRunState,
  AiUsageLedger,
};

export default {
  async fetch(
    request: Request,
    environment: AiOrchestratorBindings,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    const startedAt = performance.now();

    try {
      const response = await app.fetch(request, environment, executionContext);
      recordWorkerRequest({
        service: 'ai-orchestrator',
        request,
        status: response.status,
        durationMs: performance.now() - startedAt,
        analytics: environment.AEREALITH_ANALYTICS,
      });
      return response;
    } catch (error) {
      recordWorkerRequest({
        service: 'ai-orchestrator',
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
