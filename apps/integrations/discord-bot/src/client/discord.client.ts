/** Creates and configures the single Sapphire client used by the bot process. */
import { resolve } from 'node:path';

import {
  ApplicationCommandRegistries,
  SapphireClient,
  type ILogger,
} from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';

import type { DiscordBotConfig } from '../config/config';

/** Creates the Sapphire client and registers the bot's nested piece paths. */
export function createDiscordClient(
  config: DiscordBotConfig,
  logger: ILogger,
): SapphireClient {
  // Guild-scoped commands update quickly in development. Passing null tells
  // Sapphire to use global registration when no development guild is set.
  ApplicationCommandRegistries.setDefaultGuildIds(
    config.discord.devGuildId ? [config.discord.devGuildId] : null,
  );

  const client = new SapphireClient({
    // Automatic discovery is disabled because this project uses deliberate,
    // feature-oriented directories instead of Sapphire's default layout.
    baseUserDirectory: null,
    id: config.discord.clientId,
    // Slash commands only require Guilds; privileged message/member intents
    // stay disabled until a feature explicitly needs them.
    intents: [GatewayIntentBits.Guilds],
    loadMessageCommandListeners: false,
    logger: { instance: logger },
  });

  // Register the two exact piece roots so nested /ping and ready listener files
  // are present in both source execution and the compiled dist layout.
  client.stores
    .get('commands')
    ?.registerPath(resolve(__dirname, '..', 'features', 'utility', 'commands'));
  client.stores
    .get('listeners')
    ?.registerPath(resolve(__dirname, '..', 'framework', 'listeners'));

  return client;
}
