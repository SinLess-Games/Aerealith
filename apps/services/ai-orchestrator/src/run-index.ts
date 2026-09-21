import type { RunRecord } from '@aerealith-ai/ai-orchestration';
import { DurableObject } from 'cloudflare:workers';

import type { AiOrchestratorBindings } from './bindings';

const RUNS_KEY = 'runs';
const MAX_INDEXED_RUNS = 500;

export type IndexedRun = Omit<RunRecord, 'output'>;

export type RunIndexPage = {
  items: readonly IndexedRun[];
  nextBefore?: string;
};

export class AiRunIndex extends DurableObject<AiOrchestratorBindings> {
  async upsertRun(run: RunRecord): Promise<void> {
    const runs = this.ctx.storage.kv.get<IndexedRun[]>(RUNS_KEY) ?? [];
    const indexed = toIndexedRun(run);
    const next = [
      indexed,
      ...runs.filter((candidate) => candidate.id !== run.id),
    ]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, MAX_INDEXED_RUNS);

    this.ctx.storage.kv.put(RUNS_KEY, next);
  }

  async listRuns(
    limit = 50,
    before?: string,
  ): Promise<RunIndexPage> {
    const boundedLimit = Math.max(1, Math.min(limit, 100));
    const runs = this.ctx.storage.kv.get<IndexedRun[]>(RUNS_KEY) ?? [];
    const filtered = before
      ? runs.filter((run) => run.createdAt < before)
      : runs;
    const items = filtered.slice(0, boundedLimit);
    const hasMore = filtered.length > items.length;
    const last = items.at(-1);

    return {
      items,
      ...(hasMore && last ? { nextBefore: last.createdAt } : {}),
    };
  }
}

function toIndexedRun(run: RunRecord): IndexedRun {
  const { output: _output, ...indexed } = run;
  return indexed;
}
