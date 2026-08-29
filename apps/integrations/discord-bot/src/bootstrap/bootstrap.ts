import type { SapphireClient } from '@sapphire/framework';
import {
  initializeObservability,
  resolveObservabilityConfigFromEnv,
} from '@aerealith-ai/observability';

import { loadDiscordBotConfig } from '../config/config';
import {
  loadProcessEnvironment,
  type DiscordEnvironmentSource,
} from '../config/env';
import { discordLogger } from '../observability/logger.adapter';

export interface BootstrapDiscordBotOptions {
  readonly environment?: DiscordEnvironmentSource;
}

/** Initializes shared observability, creates the client, and logs into Discord. */
export async function bootstrapDiscordBot(
  options: BootstrapDiscordBotOptions = {},
): Promise<SapphireClient> {
  const environment = options.environment ?? loadProcessEnvironment();

  await initializeObservability(
    resolveObservabilityConfigFromEnv(environment, {
      service: 'discord-bot',
      version: environment['OTEL_SERVICE_VERSION'],
      logging: { component: 'discord-bot' },
      node: { enabled: true, environment },
    }),
  );

  const config = loadDiscordBotConfig(environment);

  discordLogger.info(
    {
      environment: config.environment,
      developmentGuildConfigured: config.discord.devGuildId !== undefined,
    },
    'Starting the Discord bot.',
  );

  const { createDiscordClient } = await import('../client/discord.client.js');
  const client = createDiscordClient(config, discordLogger);

  await client.login(config.discord.token);
  return client;
}
