/** Converts validated environment values into the app's typed configuration. */
import { loadDiscordEnvironment, type DiscordEnvironmentSource } from './env';

/** Immutable configuration consumed by bootstrap and client construction. */
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
  // Validation happens once at this boundary; downstream modules never read
  // process.env or need to know the original environment variable names.
  const environment = loadDiscordEnvironment(source);

  return {
    environment: environment.NODE_ENV,
    discord: {
      token: environment.DISCORD_TOKEN,
      clientId: environment.DISCORD_CLIENT_ID,
      // exactOptionalPropertyTypes prefers omitting an absent optional key over
      // assigning undefined explicitly.
      ...(environment.DISCORD_DEV_GUILD_ID === undefined
        ? {}
        : { devGuildId: environment.DISCORD_DEV_GUILD_ID }),
    },
  };
}
