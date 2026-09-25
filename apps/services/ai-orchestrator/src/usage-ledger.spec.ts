import { AiUsageLedger } from './usage-ledger';

function createLedger() {
  const values = new Map<string, unknown>();
  const ctx = {
    storage: {
      kv: {
        get<T>(key: string): T | undefined {
          return values.get(key) as T | undefined;
        },
        put(key: string, value: unknown) {
          values.set(key, value);
        },
      },
    },
  };

  return new AiUsageLedger(ctx as never, {} as never);
}

describe('AiUsageLedger', () => {
  it('enforces daily run limits', async () => {
    const ledger = createLedger();
    const now = new Date('2026-09-21T12:00:00.000Z');

    await expect(
      ledger.consumeRun(1, 0, now),
    ).resolves.toMatchObject({
      allowed: true,
      usage: { runs: 1 },
    });

    await expect(
      ledger.consumeRun(1, 0, now),
    ).resolves.toMatchObject({
      allowed: false,
      reason: 'DAILY_RUN_LIMIT',
    });
  });

  it('rolls back reserved runs after failed dispatch', async () => {
    const ledger = createLedger();
    const now = new Date('2026-09-21T12:00:00.000Z');

    await ledger.consumeRun(10, 0, now);
    await expect(ledger.releaseRun(now)).resolves.toMatchObject({
      runs: 0,
    });
    await expect(ledger.releaseRun(now)).resolves.toMatchObject({
      runs: 0,
    });
  });

  it('records token usage and estimated cost', async () => {
    const ledger = createLedger();
    const now = new Date('2026-09-21T12:00:00.000Z');

    await ledger.recordUsage(
      {
        inputUnits: 100,
        outputUnits: 25,
        totalUnits: 125,
        estimatedCostUsd: 0.004,
      },
      now,
    );

    await expect(ledger.getUsage(now)).resolves.toMatchObject({
      day: '2026-09-21',
      inputUnits: 100,
      outputUnits: 25,
      totalUnits: 125,
      estimatedCostUsd: 0.004,
    });
  });

  it('resets counters on a new UTC day', async () => {
    const ledger = createLedger();

    await ledger.consumeRun(
      10,
      0,
      new Date('2026-09-21T23:59:59.000Z'),
    );

    await expect(
      ledger.getUsage(new Date('2026-09-22T00:00:01.000Z')),
    ).resolves.toEqual({
      day: '2026-09-22',
      runs: 0,
      inputUnits: 0,
      outputUnits: 0,
      totalUnits: 0,
      estimatedCostUsd: 0,
    });
  });

  it('blocks new runs once the configured cost budget is reached', async () => {
    const ledger = createLedger();
    const now = new Date('2026-09-21T12:00:00.000Z');

    await ledger.recordUsage(
      { estimatedCostUsd: 1.25 },
      now,
    );

    await expect(
      ledger.consumeRun(0, 1, now),
    ).resolves.toMatchObject({
      allowed: false,
      reason: 'DAILY_COST_BUDGET',
      usage: { estimatedCostUsd: 1.25 },
    });
  });
});
