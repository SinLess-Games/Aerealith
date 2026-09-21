import {
  isTerminalRunStatus,
  type RunRecord,
} from '@aerealith-ai/ai-orchestration';

import type {
  WorkflowBinding,
  WorkflowRunParams,
} from './bindings';
import type { DurableObjectRunStore } from './run-store';

export class WorkflowControlUnavailableError extends Error {
  constructor() {
    super('Workflow instance control is not available.');
    this.name = 'WorkflowControlUnavailableError';
  }
}

export class AiRunController {
  constructor(
    private readonly workflow: WorkflowBinding<WorkflowRunParams>,
    private readonly runs: DurableObjectRunStore,
  ) {}

  async cancel(runId: string): Promise<RunRecord | undefined> {
    const current = await this.runs.get(runId);

    if (!current || isTerminalRunStatus(current.status)) {
      return current;
    }

    if (!this.workflow.get) {
      throw new WorkflowControlUnavailableError();
    }

    const instance = await this.workflow.get(runId);
    await instance.terminate();

    return this.runs.cancel(runId);
  }
}
