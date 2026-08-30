import { execFileSync } from 'child_process';
import { join } from 'path';

describe('CLI tests', () => {
  it('should print a message', () => {
    const cliPath = join(process.cwd(), 'dist/apps/integrations/discord-bot');

    const output = execFileSync('node', [cliPath]).toString();

    expect(output).toMatch(/Hello World/);
  });
});
