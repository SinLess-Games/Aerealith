import {
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

import type { PasswordHasher } from '@aerealith-ai/auth';

const scrypt = promisify(nodeScrypt);
const KeyLength = 64;

/** Node-native scrypt password hashing with a unique salt per credential. */
export class CryptoPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = (await scrypt(password, salt, KeyLength)) as Buffer;
    return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    const [algorithm, encodedSalt, encodedDigest] = encodedHash.split('$');
    if (algorithm !== 'scrypt' || !encodedSalt || !encodedDigest) return false;

    const expected = Buffer.from(encodedDigest, 'base64url');
    if (expected.length !== KeyLength) return false;

    const actual = (await scrypt(
      password,
      Buffer.from(encodedSalt, 'base64url'),
      KeyLength,
    )) as Buffer;
    return timingSafeEqual(actual, expected);
  }
}
