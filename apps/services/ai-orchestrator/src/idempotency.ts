import type { OrchestrationRequest } from '@aerealith-ai/ai-orchestration';

export type IdempotentRunIdentity = {
  runId: string;
  requestFingerprint: string;
};

export async function createIdempotentRunIdentity(
  tenantId: string,
  idempotencyKey: string,
  request: OrchestrationRequest,
): Promise<IdempotentRunIdentity> {
  const normalizedKey = idempotencyKey.trim();

  if (!normalizedKey || normalizedKey.length > 128) {
    throw new Error(
      'Idempotency-Key must contain between 1 and 128 characters.',
    );
  }

  const [runDigest, requestDigest] = await Promise.all([
    sha256(`${tenantId}\u0000${normalizedKey}`),
    sha256(canonicalJson(request)),
  ]);

  return {
    runId: digestUuid(runDigest),
    requestFingerprint: hex(requestDigest),
  };
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (
    typeof value === 'object' &&
    value !== null
  ) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }

  return value;
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(value),
    ),
  );
}

function digestUuid(digest: Uint8Array): string {
  const bytes = digest.slice(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const value = hex(bytes);

  return [
    value.slice(0, 8),
    value.slice(8, 12),
    value.slice(12, 16),
    value.slice(16, 20),
    value.slice(20, 32),
  ].join('-');
}

function hex(bytes: Uint8Array): string {
  return [...bytes]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}
