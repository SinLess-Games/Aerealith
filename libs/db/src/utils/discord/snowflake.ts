const DISCORD_SNOWFLAKE_PATTERN = /^(?:0|[1-9]\d{0,19})$/;

/** Discord snowflakes stay strings so JavaScript cannot lose precision. */
export type DiscordSnowflake = string & {
  readonly __discordSnowflake: unique symbol;
};

export function isDiscordSnowflake(value: unknown): value is DiscordSnowflake {
  return typeof value === 'string' && DISCORD_SNOWFLAKE_PATTERN.test(value);
}

export function toDiscordSnowflake(value: string | bigint): DiscordSnowflake {
  const normalized =
    typeof value === 'bigint' ? value.toString() : value.trim();
  if (!isDiscordSnowflake(normalized)) {
    throw new TypeError(
      'Discord snowflakes must be unsigned decimal strings of at most 20 digits.',
    );
  }
  return normalized;
}

export function discordSnowflakeCreatedAt(value: string | bigint): Date {
  const snowflake = BigInt(toDiscordSnowflake(value));
  const discordEpoch = 1_420_070_400_000n;
  return new Date(Number((snowflake >> 22n) + discordEpoch));
}
