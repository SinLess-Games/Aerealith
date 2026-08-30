/** Verifies Sapphire client configuration without constructing a live client. */
import { resolve } from 'node:path';

import {
  ApplicationCommandRegistries,
  SapphireClient,
  type ILogger,
} from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';

import type { DiscordBotConfig } from '../config/config';
import { createDiscordClient } from './discord.client';

jest.mock('@sapphire/framework', () => {
  // Create mocks inside the factory because Jest evaluates this callback before
  // top-level test variables are initialized.
  const registerPath = jest.fn();
  const getStore = jest.fn(() => ({ registerPath }));
  const setDefaultGuildIds = jest.fn();
  const sapphireClient = jest.fn((options: unknown) => ({
    options,
    stores: { get: getStore },
  }));

  return {
    ApplicationCommandRegistries: { setDefaultGuildIds },
    SapphireClient: sapphireClient,
    __discordClientMocks: { registerPath, getStore, setDefaultGuildIds },
  };
});

const frameworkMocks = (
  jest.requireMock('@sapphire/framework') as {
    __discordClientMocks: {
      registerPath: jest.Mock;
      getStore: jest.Mock;
      setDefaultGuildIds: jest.Mock;
    };
  }
).__discordClientMocks;

const logger = {
  has: jest.fn(() => true),
  trace: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  write: jest.fn(),
} satisfies ILogger;

function createConfig(devGuildId?: string): DiscordBotConfig {
  return {
    environment: 'test',
    discord: {
      token: 'test-token',
      clientId: '123456789012345678',
      ...(devGuildId === undefined ? {} : { devGuildId }),
    },
  };
}

describe('createDiscordClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses safe intents, the logger adapter, and explicit piece paths', () => {
    const client = createDiscordClient(
      createConfig('234567890123456789'),
      logger,
    );

    expect(
      ApplicationCommandRegistries.setDefaultGuildIds,
    ).toHaveBeenCalledWith(['234567890123456789']);
    expect(SapphireClient).toHaveBeenCalledWith({
      baseUserDirectory: null,
      id: '123456789012345678',
      intents: [GatewayIntentBits.Guilds],
      loadMessageCommandListeners: false,
      logger: { instance: logger },
    });
    expect(frameworkMocks.getStore).toHaveBeenNthCalledWith(1, 'commands');
    expect(frameworkMocks.getStore).toHaveBeenNthCalledWith(2, 'listeners');
    expect(frameworkMocks.registerPath).toHaveBeenNthCalledWith(
      1,
      resolve(__dirname, '..', 'features', 'utility', 'commands'),
    );
    expect(frameworkMocks.registerPath).toHaveBeenNthCalledWith(
      2,
      resolve(__dirname, '..', 'framework', 'listeners'),
    );
    expect(client).toBe(jest.mocked(SapphireClient).mock.results[0]?.value);
  });

  it('uses global command registration when no development guild is set', () => {
    createDiscordClient(createConfig(), logger);

    expect(frameworkMocks.setDefaultGuildIds).toHaveBeenCalledWith(null);
  });
});
