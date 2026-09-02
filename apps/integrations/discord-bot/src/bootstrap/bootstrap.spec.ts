/** Verifies the bot startup sequence without opening a Discord connection. */
import {
  initializeObservability,
  resolveObservabilityConfigFromEnv,
} from '@aerealith-ai/observability';

import { createDiscordClient } from '../client/discord.client';
import * as environmentModule from '../config/env';
import { discordLogger } from '../observability/logger.adapter';
import { bootstrapDiscordBot } from './bootstrap';

jest.mock('@aerealith-ai/observability', () => ({
  initializeObservability: jest.fn().mockResolvedValue({}),
  resolveObservabilityConfigFromEnv: jest.fn(() => ({
    service: 'discord-bot',
  })),
}));

jest.mock('../client/discord.client', () => ({
  createDiscordClient: jest.fn(),
}));

jest.mock('../observability/logger.adapter', () => ({
  discordLogger: {
    info: jest.fn(),
  },
}));

const validEnvironment = {
  NODE_ENV: 'test',
  DISCORD_TOKEN: 'test-token',
  DISCORD_CLIENT_ID: '123456789012345678',
} as const;

describe('bootstrapDiscordBot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes telemetry before creating and logging in the client', async () => {
    const client = {
      login: jest.fn().mockResolvedValue('authenticated'),
    };
    jest.mocked(createDiscordClient).mockReturnValue(client as never);

    await expect(
      bootstrapDiscordBot({ environment: validEnvironment }),
    ).resolves.toBe(client);

    expect(resolveObservabilityConfigFromEnv).toHaveBeenCalledWith(
      validEnvironment,
      expect.objectContaining({
        service: 'discord-bot',
        node: { enabled: true, environment: validEnvironment },
      }),
    );
    expect(initializeObservability).toHaveBeenCalledWith({
      service: 'discord-bot',
    });
    expect(createDiscordClient).toHaveBeenCalledWith(
      {
        environment: 'test',
        discord: {
          token: 'test-token',
          clientId: '123456789012345678',
        },
      },
      discordLogger,
    );
    expect(client.login).toHaveBeenCalledWith('test-token');
    expect(
      jest.mocked(initializeObservability).mock.invocationCallOrder[0],
    ).toBeLessThan(
      jest.mocked(createDiscordClient).mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it('loads the process environment when no snapshot is supplied', async () => {
    const client = { login: jest.fn().mockResolvedValue(undefined) };
    jest.mocked(createDiscordClient).mockReturnValue(client as never);
    const loadEnvironment = jest
      .spyOn(environmentModule, 'loadProcessEnvironment')
      .mockReturnValue(validEnvironment);

    await bootstrapDiscordBot();

    expect(loadEnvironment).toHaveBeenCalledTimes(1);
    expect(discordLogger.info).toHaveBeenCalledWith(
      {
        environment: 'test',
        developmentGuildConfigured: false,
      },
      'Starting the Discord bot.',
    );
  });
});
