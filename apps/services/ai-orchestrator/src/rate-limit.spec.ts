import { AiRateLimit } from './rate-limit';

function createLimiter() {
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

  return new AiRateLimit(ctx as never, {} as never);
}

describe('AiRateLimit', () => {
  it('allows requests until the fixed-window limit is reached', async () => {
    const limiter = createLimiter();

    await expect(limiter.consume(2, 60_000, 1_000)).resolves.toMatchObject({
      allowed: true,
      remaining: 1,
    });
    await expect(limiter.consume(2, 60_000, 2_000)).resolves.toMatchObject({
      allowed: true,
      remaining: 0,
    });
    await expect(limiter.consume(2, 60_000, 3_000)).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
    });
  });

  it('resets after the configured window', async () => {
    const limiter = createLimiter();

    await limiter.consume(1, 60_000, 1_000);
    await expect(
      limiter.consume(1, 60_000, 61_001),
    ).resolves.toMatchObject({
      allowed: true,
      remaining: 0,
    });
  });
});
