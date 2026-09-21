import type { OrchestrationRequest } from '@aerealith-ai/ai-orchestration';

import type { WorkflowRunParams } from './bindings';
import { CloudflareWorkflowOrchestrationEngine } from './cloudflare-workflow-engine';

describe('CloudflareWorkflowOrchestrationEngine', () => {
  it('creates a Workflow instance using the run id', async () => {
    const create = vi.fn(
      async (_options: { id?: string; params: WorkflowRunParams }) => undefined,
    );
    const engine = new CloudflareWorkflowOrchestrationEngine({ create });
    const request: OrchestrationRequest = {
      capability: 'text',
      input: 'hello',
    };

    const run = await engine.submit(request);

    expect(run.status).toBe('accepted');
    expect(run.capability).toBe('text');
    expect(create).toHaveBeenCalledTimes(1);

    const options = create.mock.calls[0]?.[0] as
      | { id?: string; params: WorkflowRunParams }
      | undefined;

    expect(options?.id).toBe(run.id);
    expect(options?.params.runId).toBe(run.id);
    expect(options?.params.request).toEqual(request);
  });
});
