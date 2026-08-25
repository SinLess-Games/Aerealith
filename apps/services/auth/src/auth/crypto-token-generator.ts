import { createHash, randomBytes } from 'node:crypto';

import type { GeneratedToken, TokenGenerator } from '@aerealith-ai/auth';

export class CryptoTokenGenerator implements TokenGenerator {
  async generate(entropyBytes: number): Promise<GeneratedToken> {
    const token = randomBytes(entropyBytes).toString('base64url');
    return { token, digest: await this.digest(token) };
  }

  async digest(token: string): Promise<string> {
    return createHash('sha256').update(token).digest('base64url');
  }
}
