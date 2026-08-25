import { describe, expect, it } from 'vitest';

import { CryptoTokenGenerator } from './crypto-token-generator';

describe('CryptoTokenGenerator', () => {
  it('creates independent high-entropy tokens and exposes only their digest for storage', async () => {
    const generator = new CryptoTokenGenerator();
    const first = await generator.generate(48);
    const second = await generator.generate(48);

    expect(first.token).not.toBe(second.token);
    expect(first.digest).not.toBe(second.digest);
    expect(first.token).not.toBe(first.digest);
    expect(first.token).toHaveLength(64);
    await expect(generator.digest(first.token)).resolves.toBe(first.digest);
  });
});
