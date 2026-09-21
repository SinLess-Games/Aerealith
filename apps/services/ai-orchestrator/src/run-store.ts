import type {
  RunRecord,
  RunStatus,
  RunStatusPatch,
  RunStore,
} from '@aerealith-ai/ai-orchestration';

import type {
  AiOrchestratorBindings,
  RunStateNamespace,
} from './bindings';

export class DurableObjectRunStore implements RunStore {
  constructor(private readonly namespace: RunStateNamespace) {}

  async create(run: RunRecord): Promise<void> {
    await this.stub(run.id).createRun(run);
  }

  get(runId: string): Promise<RunRecord | undefined> {
    return this.stub(runId).getRun();
  }

  async updateStatus(
    runId: string,
    status: RunStatus,
    patch: RunStatusPatch = {},
  ): Promise<void> {
    await this.stub(runId).updateStatus(status, patch);
  }

  cancel(runId: string): Promise<RunRecord> {
    return this.stub(runId).cancelRun();
  }

  private stub(runId: string) {
    const id = this.namespace.idFromName(runId);
    return this.namespace.get(id);
  }
}

export function createRunStore(
  bindings: AiOrchestratorBindings,
): DurableObjectRunStore | undefined {
  return bindings.AI_RUN_STATE
    ? new DurableObjectRunStore(bindings.AI_RUN_STATE)
    : undefined;
}
