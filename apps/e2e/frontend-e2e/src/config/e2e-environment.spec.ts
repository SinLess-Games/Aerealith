import { expect, test } from '@playwright/test';

import { loadE2EEnvironment } from './e2e-environment';

const liveEnvironment = {
  E2E_TARGET: 'local',
  E2E_BASE_URL: 'http://localhost:4200',
  E2E_AUTH_URL: 'http://localhost:8787',
  E2E_API_URL: 'http://localhost:8788',
  E2E_DATABASE_URL:
    'postgresql://e2e_user:placeholder@localhost:5432/aerealith_e2e',
  E2E_PLATFORM_OWNER_EMAIL: 'owner@example.invalid',
  E2E_PLATFORM_OWNER_PASSWORD: 'placeholder-not-a-real-secret',
  E2E_ALLOW_DATABASE_MUTATION: 'true',
} satisfies NodeJS.ProcessEnv;

test.describe('E2E environment safety boundary', () => {
  test('uses the non-mutating mock target without credentials by default', () => {
    const environment = loadE2EEnvironment({});

    expect(environment.target).toBe('mock');
    expect(environment.databaseUrl).toBeUndefined();
  });

  test('rejects a non-local service in local mode', () => {
    expect(() =>
      loadE2EEnvironment({
        ...liveEnvironment,
        E2E_AUTH_URL: 'https://auth.preview.example.invalid',
      }),
    ).toThrow(/must target localhost/u);
  });

  test('accepts the standard local database and owner variable names', () => {
    const environment = loadE2EEnvironment({
      ...liveEnvironment,
      E2E_DATABASE_URL: ' ',
      E2E_PLATFORM_OWNER_EMAIL: '',
      E2E_PLATFORM_OWNER_PASSWORD: undefined,
      DATABASE_URL: liveEnvironment.E2E_DATABASE_URL,
      ADMIN_EMAIL: liveEnvironment.E2E_PLATFORM_OWNER_EMAIL,
      ADMIN_PASSWORD: liveEnvironment.E2E_PLATFORM_OWNER_PASSWORD,
    });

    expect(environment.databaseUrl).toBe(liveEnvironment.E2E_DATABASE_URL);
    expect(environment.platformOwnerEmail).toBe(
      liveEnvironment.E2E_PLATFORM_OWNER_EMAIL,
    );
    expect(environment.platformOwnerPassword).toBe(
      liveEnvironment.E2E_PLATFORM_OWNER_PASSWORD,
    );
  });

  test('rejects a database without an explicit non-production marker', () => {
    expect(() =>
      loadE2EEnvironment({
        ...liveEnvironment,
        E2E_DATABASE_URL:
          'postgresql://e2e_user:placeholder@localhost:5432/aerealith',
      }),
    ).toThrow(/database name contains e2e, test, preview, or dev/u);
  });

  test('rejects production hosts in preview mode', () => {
    expect(() =>
      loadE2EEnvironment({
        ...liveEnvironment,
        E2E_TARGET: 'preview',
        E2E_BASE_URL: 'https://aerealith.com',
        E2E_AUTH_URL: 'https://auth.aerealith.com',
        E2E_API_URL: 'https://api.aerealith.com',
        E2E_ALLOW_REMOTE_MUTATION: 'true',
      }),
    ).toThrow(/must never target production/u);
  });

  test('requires two explicit mutation opt-ins for preview targets', () => {
    expect(() =>
      loadE2EEnvironment({
        ...liveEnvironment,
        E2E_TARGET: 'preview',
        E2E_BASE_URL: 'https://web.auth-e2e.example.invalid',
        E2E_AUTH_URL: 'https://auth.auth-e2e.example.invalid',
        E2E_API_URL: 'https://api.auth-e2e.example.invalid',
      }),
    ).toThrow(/E2E_ALLOW_REMOTE_MUTATION=true/u);
  });

  test('does not use local variable fallbacks for preview targets', () => {
    expect(() =>
      loadE2EEnvironment({
        ...liveEnvironment,
        E2E_TARGET: 'preview',
        E2E_DATABASE_URL: undefined,
        DATABASE_URL: liveEnvironment.E2E_DATABASE_URL,
      }),
    ).toThrow(/E2E_DATABASE_URL is required/u);
  });
});
