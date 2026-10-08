import { Builtins, Cli } from 'clipanion';
import { specs } from './lib/commands.js';
import { defineCommand } from './lib/define.js';

export function createCli(): Cli {
  const cli = new Cli({
    binaryLabel: 'Aerealith CLI',
    binaryName: 'aerealith',
    binaryVersion: '0.0.1',
  });
  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);
  for (const spec of specs) cli.register(defineCommand(spec));
  return cli;
}

export { specs } from './lib/commands.js';
export { findRepoRoot, runSteps, splitDryRun } from './lib/run.js';
