import {
  assertRunStatusTransition,
  type RunRecord,
  type RunStatus,
} from '@aerealith-ai/ai-orchestration';
import { DurableObject } from 'cloudflare:workers';

import type { AiOrchestratorBindings } from './bindings';

const RUN_KEY = 'run';

export class AiRunState extends DurableObject<AiOrchestratorBindings> {
  async createRun(run: RunRecord): Promise<RunRecord> {
    const existing = this.ctx.storage.kv.get<RunRecord>(RUN_KEY);

    if (existing) {
      return existing;
    }

    this.ctx.storage.kv.put(RUN_KEY, run);
    return run;
  }

  async getRun(): Promise<RunRecord | undefined> {
    return this.ctx.storage.kv.get<RunRecord>(RUN_KEY);
  }

  async updateStatus(
    status: RunStatus,
    patch: Partial<Omit<RunRecord, 'id' | 'status' | 'createdAt'>> = {},
  ): Promise<RunRecord> {
    const current = this.requireRun();

    assertRunStatusTransition(current.status, status);

    const updated: RunRecord = {
      ...current,
      ...patch,
      id: current.id,
      status,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.ctx.storage.kv.put(RUN_KEY, updated);
    return updated;
  }

  async cancelRun(): Promise<RunRecord> {
    const current = this.requireRun();

    if (
      current.status === 'succeeded' ||
      current.status === 'failed' ||
      current.status === 'cancelled'
    ) {
      return current;
    }

    return this.updateStatus('cancelled');
  }

  private requireRun(): RunRecord {
    const run = this.ctx.storage.kv.get<RunRecord>(RUN_KEY);

    if (!run) {
      throw new Error('AI run state has not been initialized.');
    }

    return run;
  }
}
