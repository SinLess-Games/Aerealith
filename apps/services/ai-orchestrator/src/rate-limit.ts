import { DurableObject } from 'cloudflare:workers';

import type { AiOrchestratorBindings } from './bindings';

const STATE_KEY = 'window';

type WindowState = {
  startedAtMs: number;
  count: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export class AiRateLimit extends DurableObject<AiOrchestratorBindings> {
  async consume(
    limit: number,
    windowMs: number,
    nowMs = Date.now(),
  ): Promise<RateLimitDecision> {
    const boundedLimit = Math.max(1, Math.floor(limit));
    const boundedWindowMs = Math.max(1_000, Math.floor(windowMs));
    const current = this.ctx.storage.kv.get<WindowState>(STATE_KEY);
    const state =
      !current || nowMs - current.startedAtMs >= boundedWindowMs
        ? { startedAtMs: nowMs, count: 0 }
        : current;
    const resetAt = state.startedAtMs + boundedWindowMs;

    if (state.count >= boundedLimit) {
      return {
        allowed: false,
        limit: boundedLimit,
        remaining: 0,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((resetAt - nowMs) / 1_000),
        ),
      };
    }

    const next: WindowState = {
      ...state,
      count: state.count + 1,
    };
    this.ctx.storage.kv.put(STATE_KEY, next);

    return {
      allowed: true,
      limit: boundedLimit,
      remaining: Math.max(0, boundedLimit - next.count),
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((resetAt - nowMs) / 1_000),
      ),
    };
  }
}

export class AiRateLimiter {
  constructor(
    private readonly namespace: {
      idFromName(name: string): unknown;
      get(id: unknown): {
        consume(
          limit: number,
          windowMs: number,
        ): Promise<RateLimitDecision>;
      };
    },
  ) {}

  consume(
    tenantId: string,
    limit: number,
    windowMs: number,
  ): Promise<RateLimitDecision> {
    const id = this.namespace.idFromName(tenantId);
    return this.namespace.get(id).consume(limit, windowMs);
  }
}
