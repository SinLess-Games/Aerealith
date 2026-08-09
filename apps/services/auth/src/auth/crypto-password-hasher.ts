import {
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from 'node:crypto';

import type { PasswordHasher } from '@aerealith-ai/auth';

const KeyLength = 64;
const Parameters = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;

/** Node-native scrypt password hashing with a unique salt per credential. */
export class CryptoPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = await derive(password, salt, Parameters);
    return `scrypt$v1$${Parameters.N}$${Parameters.r}$${Parameters.p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    const parts = encodedHash.split('$');
    const legacy = parts.length === 3;
    const [
      algorithm,
      version,
      nValue,
      rValue,
      pValue,
      encodedSalt,
      encodedDigest,
    ] = legacy
      ? [
          parts[0],
          undefined,
          undefined,
          undefined,
          undefined,
          parts[1],
          parts[2],
        ]
      : parts;
    if (
      algorithm !== 'scrypt' ||
      (!legacy && version !== 'v1') ||
      !encodedSalt ||
      !encodedDigest
    )
      return false;
    const N = legacy ? Parameters.N : Number(nValue);
    const r = legacy ? Parameters.r : Number(rValue);
    const p = legacy ? Parameters.p : Number(pValue);
    if (
      !Number.isInteger(N) ||
      N < 1024 ||
      N > 32768 ||
      (N & (N - 1)) !== 0 ||
      !Number.isInteger(r) ||
      r < 1 ||
      r > 16 ||
      !Number.isInteger(p) ||
      p < 1 ||
      p > 4
    )
      return false;

    const expected = Buffer.from(encodedDigest, 'base64url');
    if (expected.length !== KeyLength) return false;

    const actual = await derive(
      password,
      Buffer.from(encodedSalt, 'base64url'),
      { N, r, p, maxmem: Parameters.maxmem },
    );
    return timingSafeEqual(actual, expected);
  }

  needsRehash(encodedHash: string): boolean {
    const parts = encodedHash.split('$');
    return (
      parts.length !== 7 ||
      parts[0] !== 'scrypt' ||
      parts[1] !== 'v1' ||
      parts[2] !== String(Parameters.N) ||
      parts[3] !== String(Parameters.r) ||
      parts[4] !== String(Parameters.p)
    );
  }
}

function derive(
  password: string,
  salt: Buffer,
  options: { N: number; r: number; p: number; maxmem: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    nodeScrypt(password, salt, KeyLength, options, (error, derived) =>
      error ? reject(error) : resolve(derived),
    ),
  );
}
