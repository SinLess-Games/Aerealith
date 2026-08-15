import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

import { loadE2EEnvironment } from './src/config/e2e-environment';

const environment = loadE2EEnvironment();

const mockProjects = [
  {
    name: 'chromium',
    testIgnore: /src\/specs\//u,
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    testIgnore: /src\/specs\//u,
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    testIgnore: /src\/specs\//u,
    use: { ...devices['Desktop Safari'] },
  },
];

const authSecurityProject = {
  name: 'auth-security',
  testMatch: /src\/specs\/.*\.spec\.ts/u,
  // Live auth traces can retain credential-bearing request bodies. Keep
  // failure screenshots/video, but never write network traces for this suite.
  use: { ...devices['Desktop Chrome'], trace: 'off' as const },
};

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  timeout: environment.target === 'mock' ? 30_000 : 120_000,
  expect: { timeout: environment.target === 'mock' ? 5_000 : 30_000 },
  fullyParallel: environment.target === 'mock',
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  workers: environment.target === 'mock' ? undefined : 1,
  reporter: process.env['CI']
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: environment.frontendUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: createWebServers(environment),
  projects:
    environment.target === 'mock' ? mockProjects : [authSecurityProject],
});

function createWebServers(current: ReturnType<typeof loadE2EEnvironment>) {
  if (current.target === 'preview') return undefined;

  const frontend = {
    command: 'pnpm exec vite preview --config apps/frontend/vite.config.mts',
    url: current.frontendUrl,
    reuseExistingServer: current.target === 'mock' && !process.env['CI'],
    cwd: workspaceRoot,
    timeout: 120_000,
    env: {
      ...process.env,
      AUTH_SERVICE_URL: current.authUrl,
      API_SERVICE_URL: current.apiUrl,
      E2E_ENABLE_SERVICE_PROXY: String(current.target === 'local'),
    },
  };

  if (current.target === 'mock') return frontend;

  const workerEnvironment = {
    ...process.env,
    DATABASE_URL: current.databaseUrl!,
    RESEND_API_KEY: 're_replace_with_e2e_disabled_key',
  };

  return [
    {
      command: 'pnpm nx run service-auth:dev-e2e',
      url: `${current.authUrl}/health`,
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGINT' as const, timeout: 10_000 },
      cwd: workspaceRoot,
      timeout: 120_000,
      env: workerEnvironment,
    },
    {
      command: 'pnpm nx run service-api:dev-e2e',
      url: `${current.apiUrl}/health`,
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGINT' as const, timeout: 10_000 },
      cwd: workspaceRoot,
      timeout: 120_000,
      env: workerEnvironment,
    },
    frontend,
  ];
}
