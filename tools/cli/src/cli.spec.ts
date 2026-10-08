import { describe, expect, it } from 'vitest';
import { specs } from './lib/commands.js';
import { splitDryRun } from './lib/run.js';

describe('splitDryRun', () => {
  it('strips --dry-run and reports it', () => {
    expect(splitDryRun(['a', '--dry-run', 'b'])).toEqual({
      args: ['a', 'b'],
      dryRun: true,
    });
    expect(splitDryRun(['a'])).toEqual({ args: ['a'], dryRun: false });
  });
});

describe('specs', () => {
  it('has unique paths', () => {
    const keys = specs.map((s) => s.path.join(' '));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('forwards the service name to the generator', () => {
    const spec = specs.find((s) => s.path.join(' ') === 'new service');
    expect(spec?.steps(['demo'])[0]).toEqual([
      'pnpm',
      'nx',
      'g',
      '@aerealith-ai/service-generator:service',
      '--name',
      'demo',
    ]);
  });
});
