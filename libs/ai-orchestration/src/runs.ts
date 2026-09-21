import type { RunRecord, RunStatus } from './contracts';

export interface RunStore {
  create(run: RunRecord): Promise<void>;
  get(runId: string): Promise<RunRecord | undefined>;
  updateStatus(
    runId: string,
    status: RunStatus,
    patch?: Partial<Omit<RunRecord, 'id' | 'status'>>,
  ): Promise<void>;
}

export interface RunDispatcher {
  dispatch(runId: string): Promise<void>;
}
