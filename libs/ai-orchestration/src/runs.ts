import type { RunRecord, RunStatus } from './contracts';

export type RunStatusPatch = Partial<
  Omit<RunRecord, 'id' | 'status' | 'createdAt'>
>;

export interface RunStore {
  create(run: RunRecord): Promise<void>;
  get(runId: string): Promise<RunRecord | undefined>;
  updateStatus(
    runId: string,
    status: RunStatus,
    patch?: RunStatusPatch,
  ): Promise<void>;
}

export interface RunDispatcher {
  dispatch(runId: string): Promise<void>;
}
