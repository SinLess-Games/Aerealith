import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export type Step = readonly string[];

export function findRepoRoot(start: string = process.cwd()): string {
  let dir = resolve(start);
  while (!existsSync(join(dir, 'pnpm-workspace.yaml'))) {
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        'Not inside the Aerealith workspace (pnpm-workspace.yaml not found).',
      );
    }
    dir = parent;
  }
  return dir;
}

export function splitDryRun(args: readonly string[]): {
  args: string[];
  dryRun: boolean;
} {
  const rest = args.filter((a) => a !== '--dry-run');
  return { args: rest, dryRun: rest.length !== args.length };
}

/** Runs steps sequentially, stopping at the first failure; returns the exit code. */
export function runSteps(
  steps: readonly Step[],
  opts: { dryRun?: boolean; cwd?: string; log?: (line: string) => void } = {},
): number {
  const log = opts.log ?? ((line: string) => console.log(line));
  const cwd = opts.cwd ?? findRepoRoot();
  for (const [cmd, ...args] of steps) {
    log(`$ ${[cmd, ...args].join(' ')}`);
    if (opts.dryRun) continue;
    const result = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
    if (result.error) {
      console.error(result.error.message);
      return 1;
    }
    if (result.status !== 0) return result.status ?? 1;
  }
  return 0;
}
