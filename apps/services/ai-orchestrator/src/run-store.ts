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
import { DurableObjectRunIndexStore } from './run-index-store';

export class DurableObjectRunStore implements RunStore {
  constructor(
    private readonly namespace: RunStateNamespace,
    private readonly index?: DurableObjectRunIndexStore,
  ) {}

  async create(run: RunRecord): Promise<void> {
    await this.createIfAbsent(run);
  }

  async createIfAbsent(
    run: RunRecord,
  ): Promise<{ run: RunRecord; created: boolean }> {
    const stub = this.stub(run.id);

    if (stub.createRunIfAbsent) {
      const result = await stub.createRunIfAbsent(run);
      await this.index?.upsert(result.run);
      return result;
    }

    // Compatibility fallback for local/test stubs. Production AiRunState
    // exposes createRunIfAbsent and performs the claim atomically in one DO.
    const existing = await stub.getRun();
    if (existing) {
      await this.index?.upsert(existing);
      return { run: existing, created: false };
    }

    const created = await stub.createRun(run);
    await this.index?.upsert(created);
    return { run: created, created: true };
  }

  get(runId: string): Promise<RunRecord | undefined> {
    return this.stub(runId).getRun();
  }

  async updateStatus(
    runId: string,
    status: RunStatus,
    patch: RunStatusPatch = {},
  ): Promise<void> {
    const updated = await this.stub(runId).updateStatus(status, patch);
    await this.index?.upsert(updated);
  }

  async cancel(runId: string): Promise<RunRecord> {
    const updated = await this.stub(runId).cancelRun();
    await this.index?.upsert(updated);
    return updated;
  }

  private stub(runId: string) {
    const id = this.namespace.idFromName(runId);
    return this.namespace.get(id);
  }
}

export function createRunStore(
  bindings: AiOrchestratorBindings,
): DurableObjectRunStore | undefined {
  if (!bindings.AI_RUN_STATE) return undefined;

  const index = bindings.AI_RUN_INDEX
    ? new DurableObjectRunIndexStore(bindings.AI_RUN_INDEX)
    : undefined;

  return new DurableObjectRunStore(bindings.AI_RUN_STATE, index);
}

export function createRunIndexStore(
  bindings: AiOrchestratorBindings,
): DurableObjectRunIndexStore | undefined {
  return bindings.AI_RUN_INDEX
    ? new DurableObjectRunIndexStore(bindings.AI_RUN_INDEX)
    : undefined;
}
