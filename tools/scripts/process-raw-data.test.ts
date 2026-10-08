import assert from 'node:assert/strict';
import { test } from 'node:test';
import { processingArgs } from './process-raw-data';

test('absolute paths and config survive child working-directory changes', () => {
  const args = processingArgs([
    '--root=/tmp/corpus',
    '--config',
    'settings.json',
    '--workers',
    '2',
  ]);
  assert.equal(args[args.indexOf('--input') + 1], '/tmp/corpus/raw');
  assert.equal(args[args.indexOf('--output') + 1], '/tmp/corpus/processed');
  assert.match(args[args.indexOf('--config') + 1], /\/settings.json$/);
  assert.equal(args.at(-1), '--resume');
});

test('force is explicit and invalid arguments fail before spawning', () => {
  assert.equal(processingArgs(['--force=true']).at(-1), '--force');
  assert.throws(() => processingArgs(['--root']), /Missing value/);
  assert.throws(() => processingArgs(['--workers=0']), /positive integer/);
  assert.throws(() => processingArgs(['--force', '--resume']), /Choose/);
  assert.throws(() => processingArgs(['--unknown']), /Unknown option/);
});
