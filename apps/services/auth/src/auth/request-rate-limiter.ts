import { Kind, parse, visit } from 'graphql';

export interface RequestRateLimiter {
  allow(request: Request, operation: string): Promise<boolean>;
}

export class CloudflareRequestRateLimiter implements RequestRateLimiter {
  constructor(private readonly binding: RateLimit) {}

  async allow(request: Request, operation: string): Promise<boolean> {
    for (const key of await createRateLimitKeys(request, operation)) {
      if (!(await this.binding.limit({ key })).success) return false;
    }
    return true;
  }
}

/**
 * Return one canonical IP key plus an account-identity key when the request
 * contains an email address or username. The IP key is always present, so the
 * same operation cannot evade its quota by switching HTTP transports.
 */
export async function createRateLimitKeys(
  request: Request,
  operation: string,
): Promise<string[]> {
  const ipAddress = request.headers.get('cf-connecting-ip') ?? 'anonymous';
  const identity = await readRequestIdentity(request);
  const subjects = [`ip:${ipAddress}`];
  if (identity) subjects.push(`identity:${identity}`);
  return Promise.all(
    subjects.map((subject) => hashKey(`${operation}:${subject}`)),
  );
}

/** @deprecated Prefer createRateLimitKeys so the transport-proof IP quota is retained. */
export async function createRateLimitKey(
  request: Request,
  operation: string,
): Promise<string> {
  return (await createRateLimitKeys(request, operation))[0]!;
}

/**
 * Classify only abuse-sensitive authentication operations. GraphQL queries,
 * logout, email verification, health, flags, and safe GET requests are not
 * charged against authentication attempt quotas.
 */
export async function classifySensitiveAuthOperations(
  request: Request,
): Promise<string[]> {
  if (request.method !== 'POST') return [];

  const pathname = new URL(request.url).pathname;
  const httpOperation = HttpSensitiveOperations.get(pathname);
  if (httpOperation) return [httpOperation];

  if (pathname === '/graphql') return classifyGraphqlOperations(request);
  if (pathname.startsWith('/trpc/')) {
    return unique(
      pathname
        .slice('/trpc/'.length)
        .split(',')
        .map((procedure) => TrpcSensitiveOperations.get(procedure))
        .filter((operation): operation is string => operation !== undefined),
    );
  }

  return [];
}

const HttpSensitiveOperations = new Map([
  ['/api/V1/auth/login', 'auth.login'],
  ['/api/V1/auth/sign-up', 'auth.sign-up'],
  ['/api/V1/auth/resend-verification', 'auth.resend-verification'],
  ['/api/V1/auth/password-reset/request', 'auth.password-reset.request'],
  ['/api/V1/auth/password-reset/complete', 'auth.password-reset.complete'],
]);

const TrpcSensitiveOperations = new Map([
  ['auth.login', 'auth.login'],
  ['auth.resendVerification', 'auth.resend-verification'],
]);

const GraphqlSensitiveOperations = new Map([
  ['login', 'auth.login'],
  ['resendVerification', 'auth.resend-verification'],
]);

async function classifyGraphqlOperations(request: Request): Promise<string[]> {
  try {
    const body = (await request.clone().json()) as {
      operationName?: unknown;
      query?: unknown;
    };
    if (typeof body.query !== 'string') return [];

    const document = parse(body.query);
    const selectedOperationName =
      typeof body.operationName === 'string' ? body.operationName : undefined;
    const operations: string[] = [];
    for (const definition of document.definitions) {
      if (
        definition.kind !== Kind.OPERATION_DEFINITION ||
        definition.operation !== 'mutation' ||
        (selectedOperationName &&
          definition.name?.value !== selectedOperationName)
      ) {
        continue;
      }
      visit(definition, {
        Field(node) {
          const operation = GraphqlSensitiveOperations.get(node.name.value);
          if (operation) operations.push(operation);
        },
      });
    }
    return unique(operations);
  } catch {
    // Malformed GraphQL is rejected by GraphQL Yoga without invoking auth.
    return [];
  }
}

async function readRequestIdentity(request: Request): Promise<string | null> {
  try {
    return findIdentity(await request.clone().json());
  } catch {
    return null;
  }
}

function findIdentity(value: unknown, depth = 0): string | null {
  if (!value || typeof value !== 'object' || depth > 5) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const identity = findIdentity(item, depth + 1);
      if (identity) return identity;
    }
    return null;
  }
  const record = value as Record<string, unknown>;
  for (const key of ['email', 'usernameOrEmail']) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim().toLowerCase();
    }
  }
  for (const nested of Object.values(record)) {
    const identity = findIdentity(nested, depth + 1);
    if (identity) return identity;
  }
  return null;
}

async function hashKey(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  const binary = String.fromCodePoint(...new Uint8Array(digest));
  let encoded = btoa(binary).replaceAll('+', '-').replaceAll('/', '_');

  while (encoded.endsWith('=')) encoded = encoded.slice(0, -1);

  return encoded;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
