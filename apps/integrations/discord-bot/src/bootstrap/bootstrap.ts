/**
 * Coordinates the bot's process-wide startup sequence.
 *
 * Observability is initialized before Sapphire is loaded so Node
 * instrumentation can patch supported modules before they are imported.
 */
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
  /** Optional environment snapshot used by tests and embedded runtimes. */
  readonly environment?: DiscordEnvironmentSource;
}

/** Initializes shared observability, creates the client, and logs into Discord. */
export async function bootstrapDiscordBot(
  options: BootstrapDiscordBotOptions = {},
): Promise<SapphireClient> {
  const environment = options.environment ?? loadProcessEnvironment();

  // The shared library owns logger, metrics, tracing, Sentry, and exporter
  // lifecycles. The Discord app only supplies service-specific configuration.
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

  // This import must remain lazy so framework modules load after telemetry
  // initialization. The .js suffix is required by the emitted Node ESM import.
  const { createDiscordClient } = await import('../client/discord.client.js');
  const client = createDiscordClient(config, discordLogger);

  // Sapphire loads registered pieces and establishes the gateway session as
  // part of login. Authentication failures propagate to main.ts unchanged.
  await client.login(config.discord.token);
  return client;
}
