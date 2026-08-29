import { loadDiscordEnvironment, type DiscordEnvironmentSource } from './env';

export interface DiscordBotConfig {
  readonly environment: 'development' | 'test' | 'production';
  readonly discord: {
    readonly token: string;
    readonly clientId: string;
    readonly devGuildId?: string;
  };
}

/** Creates the bot's typed configuration from the validated environment. */
export function loadDiscordBotConfig(
  source?: DiscordEnvironmentSource,
): DiscordBotConfig {
  const environment = loadDiscordEnvironment(source);

  return {
    environment: environment.NODE_ENV,
    discord: {
      token: environment.DISCORD_TOKEN,
      clientId: environment.DISCORD_CLIENT_ID,
      ...(environment.DISCORD_DEV_GUILD_ID === undefined
        ? {}
        : { devGuildId: environment.DISCORD_DEV_GUILD_ID }),
    },
  };
}
