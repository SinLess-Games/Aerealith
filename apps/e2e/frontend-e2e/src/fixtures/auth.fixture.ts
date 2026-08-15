import { randomBytes } from 'node:crypto';

import {
  test as base,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
} from '@playwright/test';

import {
  loadE2EEnvironment,
  type E2EEnvironment,
} from '../config/e2e-environment';
import { AuthPaths, readSuccess, type AuthUserResponse } from '../helpers/api';
import { E2EDatabase } from '../helpers/database';
import { E2EUserFactory, type E2EUser } from './users.fixture';

export type PlatformOwner = E2EUser;

export class AuthSecurityHarness {
  private ipSequence = 10;

  constructor(
    readonly environment: E2EEnvironment,
    readonly database: E2EDatabase,
    readonly users: E2EUserFactory,
    readonly platformOwner: PlatformOwner,
    private readonly requestFactory: typeof import('@playwright/test').request,
  ) {}

  nextIp(): string {
    this.ipSequence += 1;
    return `198.51.100.${this.ipSequence}`;
  }

  async newRequestContext(
    options: {
      base?: 'auth' | 'frontend';
      ip?: string;
      origin?: string;
    } = {},
  ): Promise<APIRequestContext> {
    return this.requestFactory.newContext({
      baseURL:
        options.base === 'frontend'
          ? this.environment.frontendUrl
          : this.environment.authUrl,
      extraHTTPHeaders: {
        origin: options.origin ?? this.environment.trustedOrigin,
        'cf-connecting-ip': options.ip ?? this.nextIp(),
      },
    });
  }

  async loginRequest(
    user: Pick<E2EUser, 'email' | 'password'>,
    options: {
      base?: 'auth' | 'frontend';
      identifier?: string;
      ip?: string;
    } = {},
  ): Promise<APIRequestContext> {
    const request = await this.newRequestContext({
      base: options.base,
      ip: options.ip,
    });
    const response = await request.post(AuthPaths.login, {
      data: {
        usernameOrEmail: options.identifier ?? user.email,
        password: user.password,
      },
    });
    if (response.status() !== 200) {
      await request.dispose();
      throw new Error(`E2E login failed with HTTP ${response.status()}.`);
    }
    return request;
  }

  async newBrowserContext(
    browser: Browser,
    options: { authenticatedAs?: E2EUser; ip?: string } = {},
  ): Promise<BrowserContext> {
    const ip = options.ip ?? this.nextIp();
    if (!options.authenticatedAs) {
      const context = await browser.newContext({
        baseURL: this.environment.frontendUrl,
        extraHTTPHeaders: { 'cf-connecting-ip': ip },
      });
      await installNecessaryConsent(context);
      return context;
    }

    const login = await this.loginRequest(options.authenticatedAs, {
      base: 'frontend',
      ip,
    });
    const storageState = await login.storageState();
    await login.dispose();
    const context = await browser.newContext({
      baseURL: this.environment.frontendUrl,
      storageState,
      extraHTTPHeaders: { 'cf-connecting-ip': ip },
    });
    await installNecessaryConsent(context);
    return context;
  }
}

type AuthSecurityFixtures = {
  auth: AuthSecurityHarness;
};

type AuthSecurityWorkerFixtures = {
  authWorker: AuthSecurityHarness;
};

export const test = base.extend<
  AuthSecurityFixtures,
  AuthSecurityWorkerFixtures
>({
  authWorker: [
    async ({ playwright }, use) => {
      const environment = loadE2EEnvironment();
      if (
        !environment.databaseUrl ||
        !environment.platformOwnerEmail ||
        !environment.platformOwnerPassword
      ) {
        throw new Error('Live auth-security E2E configuration is incomplete.');
      }

      const runId = randomBytes(4).toString('hex');
      const database = new E2EDatabase(environment.databaseUrl, runId);
      await database.ready();

      const ownerRequest = await createOwnerRequest(
        playwright.request,
        environment,
      );
      let users: E2EUserFactory | undefined;
      try {
        const response = await ownerRequest.post(AuthPaths.login, {
          data: {
            usernameOrEmail: environment.platformOwnerEmail,
            password: environment.platformOwnerPassword,
          },
        });
        const owner = await readSuccess<AuthUserResponse>(response, 200);
        users = new E2EUserFactory(environment, ownerRequest, database, runId);
        await use(
          new AuthSecurityHarness(
            environment,
            database,
            users,
            {
              id: owner.id,
              username: owner.username,
              email: owner.email,
              password: environment.platformOwnerPassword,
              emailVerified: owner.emailVerified,
              status: 'active',
            },
            playwright.request,
          ),
        );
      } finally {
        await users?.cleanup();
        await ownerRequest.dispose();
        await database.close();
      }
    },
    { scope: 'worker' },
  ],
  auth: async ({ authWorker }, use) => use(authWorker),
});

export { expect } from '@playwright/test';

async function createOwnerRequest(
  requestFactory: typeof import('@playwright/test').request,
  environment: E2EEnvironment,
): Promise<APIRequestContext> {
  return requestFactory.newContext({
    baseURL: environment.authUrl,
    extraHTTPHeaders: {
      origin: environment.trustedOrigin,
      'cf-connecting-ip': '198.51.100.1',
    },
  });
}

async function installNecessaryConsent(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    window.localStorage.setItem(
      'aerealith-consent-v1',
      JSON.stringify({
        necessary: true,
        analytics: false,
        advertising: false,
        sessionReplay: false,
      }),
    );
  });
}
