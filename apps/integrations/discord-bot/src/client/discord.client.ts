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
  ApplicationCommandRegistries.setDefaultGuildIds(
    config.discord.devGuildId ? [config.discord.devGuildId] : null,
  );

  const client = new SapphireClient({
    baseUserDirectory: null,
    id: config.discord.clientId,
    intents: [GatewayIntentBits.Guilds],
    loadMessageCommandListeners: false,
    logger: { instance: logger },
  });

  client.stores
    .get('commands')
    ?.registerPath(resolve(__dirname, '..', 'features', 'utility', 'commands'));
  client.stores
    .get('listeners')
    ?.registerPath(resolve(__dirname, '..', 'framework', 'listeners'));

  return client;
}
