import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const methodNames = [
    'signUp',
    'login',
    'currentUser',
    'logout',
    'verifyEmail',
    'resendVerification',
    'requestPasswordReset',
    'completePasswordReset',
    'listSessions',
    'revokeSession',
    'revokeOtherSessions',
    'adminOverview',
    'accountDetails',
    'updateAccount',
    'profileDetails',
    'updateProfile',
    'listAdminEntities',
    'adminEntityCatalog',
    'createAdminEntity',
    'updateAdminEntity',
    'deleteAdminEntity',
  ] as const;
  const application = Object.fromEntries(
    methodNames.map((name) => [name, vi.fn(() => `${name}-result`)]),
  );
  return {
    application,
    authServiceOptions: [] as unknown[],
    close: vi.fn(),
    createDatabaseConnection: vi.fn(),
    poolQuery: vi.fn(),
    senderKinds: [] as string[],
  };
});

vi.mock('@aerealith-ai/db', () => ({
  createDatabaseConnection: mocks.createDatabaseConnection,
}));

vi.mock('./auth-application.service', () => ({
  AuthApplicationService: class {
    constructor(_client: unknown, options: unknown) {
      mocks.authServiceOptions.push(options);
      return mocks.application;
    }
  },
}));

vi.mock('./resend-email-verification.sender', () => ({
  ConsoleEmailVerificationSender: class {
    readonly kind = 'console-verification';
    constructor() {
      mocks.senderKinds.push(this.kind);
    }
  },
  ConsolePasswordResetSender: class {
    readonly kind = 'console-reset';
    constructor() {
      mocks.senderKinds.push(this.kind);
    }
  },
  ResendEmailVerificationSender: class {
    readonly kind = 'resend-verification';
    constructor(
      readonly apiKey: string,
      readonly from: string,
    ) {
      mocks.senderKinds.push(this.kind);
    }
  },
  ResendPasswordResetSender: class {
    readonly kind = 'resend-reset';
    constructor(
      readonly apiKey: string,
      readonly from: string,
    ) {
      mocks.senderKinds.push(this.kind);
    }
  },
}));

vi.mock('./structured-auth-event.publisher', () => ({
  StructuredAuthEventPublisher: class {},
}));

import { LazyAuthApplication } from './lazy-auth-application';

const delegatedMethods = Object.keys(mocks.application);

describe('LazyAuthApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authServiceOptions.length = 0;
    mocks.senderKinds.length = 0;
    mocks.createDatabaseConnection.mockReturnValue({
      client: { name: 'database-client' },
      pool: { query: mocks.poolQuery },
      close: mocks.close,
    });
  });

  it('delegates every auth operation through one lazy application instance', () => {
    const lazy = new LazyAuthApplication({ databaseUrl: 'postgres://test' });
    const callable = lazy as unknown as Record<
      string,
      (...args: unknown[]) => unknown
    >;

    expect(mocks.createDatabaseConnection).not.toHaveBeenCalled();
    for (const method of delegatedMethods) {
      expect(callable[method]?.('first', 'second')).toBe(`${method}-result`);
      expect(
        mocks.application[method as keyof typeof mocks.application],
      ).toHaveBeenCalledWith('first', 'second');
    }

    expect(mocks.createDatabaseConnection).toHaveBeenCalledOnce();
    expect(mocks.createDatabaseConnection).toHaveBeenCalledWith({
      DATABASE_URL: 'postgres://test',
    });
    expect(mocks.authServiceOptions).toHaveLength(1);
    expect(mocks.senderKinds).toEqual(
      expect.arrayContaining(['console-verification', 'console-reset']),
    );
  });

  it('uses Resend only for a configured non-placeholder API key', () => {
    const lazy = new LazyAuthApplication({
      resendApiKey: '  re_live_key  ',
      frontendUrl: 'https://app.example.com',
    });

    lazy.adminOverview();

    expect(mocks.senderKinds).toEqual(['resend-verification', 'resend-reset']);
    expect(mocks.authServiceOptions[0]).toMatchObject({
      frontendUrl: 'https://app.example.com',
      emailSender: { apiKey: 're_live_key' },
      passwordResetSender: { apiKey: 're_live_key' },
    });
  });

  it('checks and closes the database without creating the auth service', async () => {
    const lazy = new LazyAuthApplication();

    await lazy.ready();
    await lazy.close();

    expect(mocks.poolQuery).toHaveBeenCalledWith('select 1');
    expect(mocks.authServiceOptions).toHaveLength(0);
    expect(mocks.close).toHaveBeenCalledOnce();
  });

  it('does not create a database only to close an unused instance', async () => {
    await new LazyAuthApplication().close();
    expect(mocks.createDatabaseConnection).not.toHaveBeenCalled();
  });
});
