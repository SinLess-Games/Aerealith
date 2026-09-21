import {
  assertRunStatusTransition,
  isTerminalRunStatus,
  type OrchestrationOutput,
  type RunRecord,
  type RunStatus,
} from '@aerealith-ai/ai-orchestration';
import { DurableObject } from 'cloudflare:workers';

import type { AiOrchestratorBindings } from './bindings';

const RUN_KEY = 'run';
const MAX_INLINE_OUTPUT_BYTES = 512 * 1024;

export class RunOutputTooLargeError extends Error {
  constructor(sizeBytes: number) {
    super(
      `AI run output is ${sizeBytes} bytes; inline durable output is limited to ${MAX_INLINE_OUTPUT_BYTES} bytes.`,
    );
    this.name = 'RunOutputTooLargeError';
  }
}

export class AiRunState extends DurableObject<AiOrchestratorBindings> {
  async createRun(run: RunRecord): Promise<RunRecord> {
    return (await this.createRunIfAbsent(run)).run;
  }

  async createRunIfAbsent(
    run: RunRecord,
  ): Promise<{ run: RunRecord; created: boolean }> {
    const existing = this.ctx.storage.kv.get<RunRecord>(RUN_KEY);

    if (existing) {
      return { run: existing, created: false };
    }

    validateInlineOutput(run.output);
    this.ctx.storage.kv.put(RUN_KEY, run);
    return { run, created: true };
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
    validateInlineOutput(patch.output);

    const timestamp = new Date().toISOString();
    const lifecyclePatch: Partial<RunRecord> = {
      ...(status === 'running' && !current.startedAt && !patch.startedAt
        ? { startedAt: timestamp }
        : {}),
      ...(isTerminalRunStatus(status) && !patch.completedAt
        ? { completedAt: timestamp }
        : {}),
    };

    const updated: RunRecord = {
      ...current,
      ...lifecyclePatch,
      ...patch,
      id: current.id,
      status,
      createdAt: current.createdAt,
      updatedAt: timestamp,
    };

    this.ctx.storage.kv.put(RUN_KEY, updated);
    return updated;
  }

  async cancelRun(): Promise<RunRecord> {
    const current = this.requireRun();

    if (isTerminalRunStatus(current.status)) {
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

function validateInlineOutput(output: OrchestrationOutput | undefined): void {
  if (output === undefined) return;

  const serialized = JSON.stringify(output);
  const sizeBytes = new TextEncoder().encode(serialized).byteLength;

  if (sizeBytes > MAX_INLINE_OUTPUT_BYTES) {
    throw new RunOutputTooLargeError(sizeBytes);
  }
}
