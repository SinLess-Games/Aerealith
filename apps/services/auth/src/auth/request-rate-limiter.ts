import { createHash } from 'node:crypto';

export interface RequestRateLimiter {
  allow(request: Request, operation: string): Promise<boolean>;
}

export class CloudflareRequestRateLimiter implements RequestRateLimiter {
  constructor(private readonly binding: RateLimit) {}

  async allow(request: Request, operation: string): Promise<boolean> {
    return (
      await this.binding.limit({
        key: await createRateLimitKey(request, operation),
      })
    ).success;
  }
}

export async function createRateLimitKey(
  request: Request,
  operation: string,
): Promise<string> {
  let identity = request.headers.get('cf-connecting-ip') ?? 'anonymous';
  try {
    const body = (await request.clone().json()) as {
      email?: unknown;
      usernameOrEmail?: unknown;
    };
    const candidate = body.email ?? body.usernameOrEmail;
    if (typeof candidate === 'string' && candidate.trim()) {
      identity = candidate.trim().toLowerCase();
    }
  } catch {
    // Non-JSON and malformed requests remain bounded by an anonymous/IP key.
  }
  return createHash('sha256')
    .update(`${operation}:${identity}`)
    .digest('base64url');
}
