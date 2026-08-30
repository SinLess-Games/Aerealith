/** Exercises the compiled process boundary without contacting Discord. */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

describe('Discord bot process', () => {
  it('fails safely when required Discord credentials are missing', () => {
    const entryPoint = resolve(
      process.cwd(),
      'dist/apps/integrations/discord-bot/apps/integrations/discord-bot/src/main.js',
    );
    const secretMarker = 'must-never-appear-in-output';

    // A minimal environment disables remote exporters and deliberately leaves
    // credentials blank, proving startup validation before any Discord login.
    const result = spawnSync(process.execPath, [entryPoint], {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 15_000,
      env: {
        PATH: process.env['PATH'],
        NODE_ENV: 'test',
        DISCORD_TOKEN: '',
        DISCORD_CLIENT_ID: '',
        DISCORD_DEV_GUILD_ID: secretMarker,
        LOG_PRETTY: 'false',
        METRICS_ENABLED: 'false',
        TRACING_ENABLED: 'false',
        OTEL_SDK_DISABLED: 'true',
        SENTRY_DSN: '',
      },
    });
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.error).toBeUndefined();
    expect(result.signal).toBeNull();
    expect(result.status).toBe(1);
    expect(output).toContain('Discord bot environment is invalid');
    expect(output).toContain('DISCORD_TOKEN');
    expect(output).toContain('DISCORD_CLIENT_ID');
    expect(output).not.toContain(secretMarker);
  });
});
