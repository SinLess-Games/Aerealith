export type E2ETarget = 'mock' | 'local' | 'preview';

export type E2EEnvironment = {
  target: E2ETarget;
  frontendUrl: string;
  authUrl: string;
  apiUrl: string;
  trustedOrigin: string;
  databaseUrl?: string;
  platformOwnerEmail?: string;
  platformOwnerPassword?: string;
};

const ProductionHosts = new Set([
  'aerealith.com',
  'www.aerealith.com',
  'api.aerealith.com',
  'auth.aerealith.com',
]);

export function loadE2EEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): E2EEnvironment {
  const target = parseTarget(source['E2E_TARGET']);
  const frontendUrl = normalizedUrl(
    source['E2E_BASE_URL'] ?? source['BASE_URL'] ?? 'http://localhost:4200',
    'E2E_BASE_URL',
  );
  const authUrl = normalizedUrl(
    source['E2E_AUTH_URL'] ?? 'http://localhost:8787',
    'E2E_AUTH_URL',
  );
  const apiUrl = normalizedUrl(
    source['E2E_API_URL'] ?? 'http://localhost:8788',
    'E2E_API_URL',
  );

  if (target === 'mock') {
    return {
      target,
      frontendUrl,
      authUrl,
      apiUrl,
      trustedOrigin: new URL(frontendUrl).origin,
    };
  }

  const databaseUrl = required(
    source,
    'E2E_DATABASE_URL',
    target === 'local' ? 'DATABASE_URL' : undefined,
  );
  const platformOwnerEmail = required(
    source,
    'E2E_PLATFORM_OWNER_EMAIL',
    target === 'local' ? 'ADMIN_EMAIL' : undefined,
  );
  const platformOwnerPassword = required(
    source,
    'E2E_PLATFORM_OWNER_PASSWORD',
    target === 'local' ? 'ADMIN_PASSWORD' : undefined,
  );

  if (source['E2E_ALLOW_DATABASE_MUTATION'] !== 'true') {
    throw new Error(
      'Auth-security E2E requires E2E_ALLOW_DATABASE_MUTATION=true for its isolated fixtures.',
    );
  }

  validateDatabaseUrl(databaseUrl);

  if (target === 'local') {
    assertLocalUrl(frontendUrl, 'E2E_BASE_URL');
    assertLocalUrl(authUrl, 'E2E_AUTH_URL');
    assertLocalUrl(apiUrl, 'E2E_API_URL');
  } else {
    for (const [name, value] of [
      ['E2E_BASE_URL', frontendUrl],
      ['E2E_AUTH_URL', authUrl],
      ['E2E_API_URL', apiUrl],
    ] as const) {
      const parsed = new URL(value);
      if (parsed.protocol !== 'https:') {
        throw new Error(`${name} must use HTTPS for preview E2E.`);
      }
      if (ProductionHosts.has(parsed.hostname)) {
        throw new Error(`${name} must never target production.`);
      }
    }
    if (source['E2E_ALLOW_REMOTE_MUTATION'] !== 'true') {
      throw new Error(
        'Preview E2E requires E2E_ALLOW_REMOTE_MUTATION=true and an isolated preview database.',
      );
    }
  }

  return {
    target,
    frontendUrl,
    authUrl,
    apiUrl,
    trustedOrigin: new URL(frontendUrl).origin,
    databaseUrl,
    platformOwnerEmail,
    platformOwnerPassword,
  };
}

function parseTarget(value: string | undefined): E2ETarget {
  if (!value || value === 'mock') return 'mock';
  if (value === 'local' || value === 'preview') return value;
  throw new Error('E2E_TARGET must be mock, local, or preview.');
}

function required(
  source: NodeJS.ProcessEnv,
  name: string,
  localFallbackName?: string,
): string {
  const value = source[name]?.trim() || source[localFallbackName ?? '']?.trim();
  if (!value) {
    const fallback = localFallbackName ? ` or ${localFallbackName}` : '';
    throw new Error(`${name}${fallback} is required for auth-security E2E.`);
  }
  return value;
}

function normalizedUrl(value: string, name: string): string {
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    parsed.pathname = parsed.pathname.replace(/\/+$/u, '');
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/$/u, '');
  } catch {
    throw new Error(`${name} must be a valid HTTP(S) URL.`);
  }
}

function assertLocalUrl(value: string, name: string): void {
  const hostname = new URL(value).hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    throw new Error(`${name} must target localhost in local E2E mode.`);
  }
}

function validateDatabaseUrl(value: string): void {
  try {
    const parsed = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol))
      throw new Error();
    if (!parsed.pathname || parsed.pathname === '/') throw new Error();
    const databaseName = decodeURIComponent(parsed.pathname.slice(1));
    if (!/(?:e2e|test|preview|dev)/iu.test(databaseName)) throw new Error();
  } catch {
    throw new Error(
      'E2E_DATABASE_URL must be a PostgreSQL URL whose database name contains e2e, test, preview, or dev.',
    );
  }
}
