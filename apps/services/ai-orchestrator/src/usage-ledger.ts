import type { Usage } from '@aerealith-ai/ai-orchestration';
import { DurableObject } from 'cloudflare:workers';

import type { AiOrchestratorBindings } from './bindings';

const STATE_KEY = 'daily-usage';

export type DailyUsage = {
  day: string;
  runs: number;
  inputUnits: number;
  outputUnits: number;
  totalUnits: number;
  estimatedCostUsd: number;
};

export type UsageDecision = {
  allowed: boolean;
  reason?: 'DAILY_RUN_LIMIT' | 'DAILY_COST_BUDGET';
  usage: DailyUsage;
};

export class AiUsageLedger extends DurableObject<AiOrchestratorBindings> {
  async consumeRun(
    dailyRunLimit: number,
    dailyCostBudgetUsd: number,
    now = new Date(),
  ): Promise<UsageDecision> {
    const usage = this.current(now);
    const runLimit = normalizeNonNegativeInteger(dailyRunLimit);
    const costBudget = normalizeNonNegativeNumber(dailyCostBudgetUsd);

    if (runLimit > 0 && usage.runs >= runLimit) {
      return {
        allowed: false,
        reason: 'DAILY_RUN_LIMIT',
        usage,
      };
    }

    if (
      costBudget > 0 &&
      usage.estimatedCostUsd >= costBudget
    ) {
      return {
        allowed: false,
        reason: 'DAILY_COST_BUDGET',
        usage,
      };
    }

    const next: DailyUsage = {
      ...usage,
      runs: usage.runs + 1,
    };
    this.ctx.storage.kv.put(STATE_KEY, next);

    return {
      allowed: true,
      usage: next,
    };
  }

  async releaseRun(now = new Date()): Promise<DailyUsage> {
    const current = this.current(now);
    const next: DailyUsage = {
      ...current,
      runs: Math.max(0, current.runs - 1),
    };

    this.ctx.storage.kv.put(STATE_KEY, next);
    return next;
  }

  async recordUsage(
    usage: Usage | undefined,
    now = new Date(),
  ): Promise<DailyUsage> {
    const current = this.current(now);

    if (!usage) return current;

    const next: DailyUsage = {
      ...current,
      inputUnits: current.inputUnits + (usage.inputUnits ?? 0),
      outputUnits: current.outputUnits + (usage.outputUnits ?? 0),
      totalUnits: current.totalUnits + (usage.totalUnits ?? 0),
      estimatedCostUsd:
        current.estimatedCostUsd + (usage.estimatedCostUsd ?? 0),
    };

    this.ctx.storage.kv.put(STATE_KEY, next);
    return next;
  }

  async getUsage(now = new Date()): Promise<DailyUsage> {
    return this.current(now);
  }

  private current(now: Date): DailyUsage {
    const day = dayKey(now);
    const existing = this.ctx.storage.kv.get<DailyUsage>(STATE_KEY);

    if (existing?.day === day) {
      return existing;
    }

    const fresh: DailyUsage = {
      day,
      runs: 0,
      inputUnits: 0,
      outputUnits: 0,
      totalUnits: 0,
      estimatedCostUsd: 0,
    };

    this.ctx.storage.kv.put(STATE_KEY, fresh);
    return fresh;
  }
}

export class AiUsageStore {
  constructor(
    private readonly namespace: {
      idFromName(name: string): unknown;
      get(id: unknown): {
        consumeRun(
          dailyRunLimit: number,
          dailyCostBudgetUsd: number,
        ): Promise<UsageDecision>;
        releaseRun(): Promise<DailyUsage>;
        recordUsage(usage?: Usage): Promise<DailyUsage>;
        getUsage(): Promise<DailyUsage>;
      };
    },
  ) {}

  consumeRun(
    tenantId: string,
    dailyRunLimit: number,
    dailyCostBudgetUsd: number,
  ): Promise<UsageDecision> {
    return this.stub(tenantId).consumeRun(
      dailyRunLimit,
      dailyCostBudgetUsd,
    );
  }

  releaseRun(tenantId: string): Promise<DailyUsage> {
    return this.stub(tenantId).releaseRun();
  }

  recordUsage(
    tenantId: string,
    usage?: Usage,
  ): Promise<DailyUsage> {
    return this.stub(tenantId).recordUsage(usage);
  }

  getUsage(tenantId: string): Promise<DailyUsage> {
    return this.stub(tenantId).getUsage();
  }

  private stub(tenantId: string) {
    const id = this.namespace.idFromName(tenantId);
    return this.namespace.get(id);
  }
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeNonNegativeInteger(value: number): number {
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function normalizeNonNegativeNumber(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}
