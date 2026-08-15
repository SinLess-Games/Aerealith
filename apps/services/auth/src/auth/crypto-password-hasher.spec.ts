import { describe, expect, it } from 'vitest';

import { CryptoPasswordHasher } from './crypto-password-hasher';

describe('CryptoPasswordHasher', () => {
  it('verifies a valid scrypt hash and preserves the exact password input', async () => {
    const hasher = new CryptoPasswordHasher();
    const hash = await hasher.hash('  Exact Password 1!  ');

    await expect(hasher.verify('  Exact Password 1!  ', hash)).resolves.toBe(
      true,
    );
    await expect(hasher.verify('Exact Password 1!', hash)).resolves.toBe(false);
    expect(hasher.needsRehash(hash)).toBe(false);
  });

  it.each([
    ['malformed', 'not-a-hash'],
    ['unsupported algorithm', 'argon2$v1$16384$8$1$c2FsdA$ZGlnZXN0'],
    ['unsupported version', 'scrypt$v2$16384$8$1$c2FsdA$ZGlnZXN0'],
    [
      'invalid digest length',
      'scrypt$v1$16384$8$1$MDEyMzQ1Njc4OWFiY2RlZg$c2hvcnQ',
    ],
    ['invalid base64url', `scrypt$v1$16384$8$1$%%%$${'a'.repeat(86)}`],
  ])('fails safely for a %s hash', async (_case, hash) => {
    await expect(
      new CryptoPasswordHasher().verify('Password 1!', hash),
    ).resolves.toBe(false);
  });

  it('fails safely when individually valid scrypt parameters exceed memory limits together', async () => {
    const hasher = new CryptoPasswordHasher();
    const parts = (await hasher.hash('Password 1!')).split('$');
    parts[2] = '32768';
    parts[3] = '16';
    parts[4] = '4';

    await expect(hasher.verify('Password 1!', parts.join('$'))).resolves.toBe(
      false,
    );
  });

  it('marks legacy, stale-parameter, and malformed hashes for rehashing', async () => {
    const hasher = new CryptoPasswordHasher();
    const current = await hasher.hash('Password 1!');
    const parts = current.split('$');
    const legacy = `scrypt$${parts[5]}$${parts[6]}`;
    const stale = [...parts];
    stale[2] = '8192';

    expect(hasher.needsRehash(legacy)).toBe(true);
    await expect(hasher.verify('Password 1!', legacy)).resolves.toBe(true);
    expect(hasher.needsRehash(stale.join('$'))).toBe(true);
    expect(hasher.needsRehash('malformed')).toBe(true);
  });
});
