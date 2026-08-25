import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  close: vi.fn(),
  createDatabaseConnection: vi.fn(),
  join: vi.fn(),
  serviceConstructor: vi.fn(),
}));

vi.mock('@aerealith-ai/db', () => ({
  createDatabaseConnection: mocks.createDatabaseConnection,
}));

vi.mock('./waitlist-application.service', () => ({
  WaitlistApplicationService: class {
    constructor(client: unknown) {
      mocks.serviceConstructor(client);
      return { join: mocks.join };
    }
  },
}));

import { LazyWaitlistApplication } from './lazy-waitlist-application';

describe('LazyWaitlistApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createDatabaseConnection.mockReturnValue({
      client: { name: 'database-client' },
      close: mocks.close,
    });
    mocks.join.mockResolvedValue({
      joined: true,
      newsletterSubscribed: false,
    });
  });

  it('creates one database-backed application on the first join', async () => {
    const application = new LazyWaitlistApplication('postgres://test');
    const input = {
      email: 'person@example.com',
      newsletter: false,
    };

    expect(mocks.createDatabaseConnection).not.toHaveBeenCalled();
    await expect(application.join(input)).resolves.toEqual({
      joined: true,
      newsletterSubscribed: false,
    });
    await application.join(input);

    expect(mocks.createDatabaseConnection).toHaveBeenCalledOnce();
    expect(mocks.createDatabaseConnection).toHaveBeenCalledWith({
      DATABASE_URL: 'postgres://test',
    });
    expect(mocks.serviceConstructor).toHaveBeenCalledOnce();
    expect(mocks.join).toHaveBeenCalledTimes(2);
    expect(mocks.join).toHaveBeenCalledWith(input);
  });

  it('does not create a connection only to close an unused application', async () => {
    const application = new LazyWaitlistApplication();
    await application.close();

    expect(mocks.createDatabaseConnection).not.toHaveBeenCalled();
    expect(mocks.close).not.toHaveBeenCalled();
  });

  it('closes a connection created by a join', async () => {
    const application = new LazyWaitlistApplication();
    await application.join({ email: 'person@example.com', newsletter: false });
    await application.close();

    expect(mocks.createDatabaseConnection).toHaveBeenCalledWith(process.env);
    expect(mocks.close).toHaveBeenCalledOnce();
  });
});
