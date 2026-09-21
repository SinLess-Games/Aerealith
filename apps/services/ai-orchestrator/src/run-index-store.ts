import type { RunRecord } from '@aerealith-ai/ai-orchestration';

import type { RunIndexNamespace } from './bindings';
import type { RunIndexPage } from './run-index';

export class DurableObjectRunIndexStore {
  constructor(private readonly namespace: RunIndexNamespace) {}

  upsert(run: RunRecord): Promise<void> {
    if (!run.tenantId) return Promise.resolve();
    return this.stub(run.tenantId).upsertRun(run);
  }

  list(
    tenantId: string,
    limit = 50,
    before?: string,
  ): Promise<RunIndexPage> {
    return this.stub(tenantId).listRuns(limit, before);
  }

  private stub(tenantId: string) {
    const id = this.namespace.idFromName(tenantId);
    return this.namespace.get(id);
  }
}
