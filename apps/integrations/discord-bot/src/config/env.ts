import { existsSync } from 'node:fs';

import { z } from 'zod';

export interface DiscordEnvironmentSource {
  readonly [key: string]: string | undefined;
}

const discordSnowflake = z
  .string()
  .trim()
  .regex(/^\d{17,20}$/u, 'must be a valid Discord ID.');

const optionalDiscordSnowflake = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  discordSnowflake.optional(),
);

const discordEnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DISCORD_TOKEN: z.string().trim().min(1, 'is required to connect to Discord.'),
  DISCORD_CLIENT_ID: discordSnowflake,
  DISCORD_DEV_GUILD_ID: optionalDiscordSnowflake,
});

export type DiscordEnvironment = z.output<typeof discordEnvironmentSchema>;

export class DiscordEnvironmentError extends Error {
  public constructor(issues: readonly string[]) {
    super(`Discord bot environment is invalid. ${issues.join('; ')}`);
    this.name = 'DiscordEnvironmentError';
  }
}

/** Loads the local environment file and returns a plain environment snapshot. */
export function loadProcessEnvironment(): DiscordEnvironmentSource {
  if (existsSync('.env')) process.loadEnvFile('.env');
  return { ...process.env };
}

/** Validates Discord environment values without retaining unrelated entries. */
export function loadDiscordEnvironment(
  source: DiscordEnvironmentSource = loadProcessEnvironment(),
): DiscordEnvironment {
  const result = discordEnvironmentSchema.safeParse(source);
  if (result.success) return result.data;

  throw new DiscordEnvironmentError(
    result.error.issues.map((issue) => {
      const name = issue.path.join('.') || 'environment';
      return `${name}: ${issue.message}`;
    }),
  );
}
