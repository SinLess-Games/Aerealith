/** Verifies that environment input is validated before it reaches the bot. */
import { loadDiscordBotConfig } from './config';
import { DiscordEnvironmentError, loadDiscordEnvironment } from './env';

const validEnvironment = {
  NODE_ENV: 'test',
  DISCORD_TOKEN: '  test-token  ',
  DISCORD_CLIENT_ID: '123456789012345678',
  DISCORD_DEV_GUILD_ID: '234567890123456789',
} as const;

describe('Discord configuration', () => {
  it('trims and maps validated environment values', () => {
    const config = loadDiscordBotConfig(validEnvironment);

    expect(config).toEqual({
      environment: 'test',
      discord: {
        token: 'test-token',
        clientId: '123456789012345678',
        devGuildId: '234567890123456789',
      },
    });
  });

  it('treats a blank development guild as absent', () => {
    const config = loadDiscordBotConfig({
      ...validEnvironment,
      DISCORD_DEV_GUILD_ID: '   ',
    });

    expect(config.discord).not.toHaveProperty('devGuildId');
  });

  it('reports invalid variable names without exposing secret values', () => {
    const secret = 'never-print-this-token';

    expect(() =>
      loadDiscordEnvironment({
        NODE_ENV: 'test',
        DISCORD_TOKEN: secret,
        DISCORD_CLIENT_ID: 'not-a-discord-id',
      }),
    ).toThrow(DiscordEnvironmentError);

    try {
      loadDiscordEnvironment({
        NODE_ENV: 'test',
        DISCORD_TOKEN: secret,
        DISCORD_CLIENT_ID: 'not-a-discord-id',
      });
    } catch (error) {
      // Validation messages identify the broken key but never echo its value.
      expect(error).toBeInstanceOf(DiscordEnvironmentError);
      expect((error as Error).message).toContain('DISCORD_CLIENT_ID');
      expect((error as Error).message).not.toContain(secret);
    }
  });

  it('requires both Discord credentials', () => {
    expect(() => loadDiscordEnvironment({ NODE_ENV: 'test' })).toThrow(
      /DISCORD_TOKEN.*DISCORD_CLIENT_ID/u,
    );
  });
});
