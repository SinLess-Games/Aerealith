/** Process downloaded corpora through the core's transactional ingestion pipeline. */
import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export function processingArgs(args: string[]): string[] {
  const values = new Map<string, string>();
  const flags = new Set<string>();
  const valueOptions = new Set([
    '--root',
    '--input',
    '--output',
    '--config',
    '--workers',
  ]);
  for (let index = 0; index < args.length; index++) {
    const [key, inline] = args[index].split(/=(.*)/s);
    if (valueOptions.has(key)) {
      const value = inline ?? args[++index];
      if (!value || value.startsWith('--'))
        throw Error(`Missing value for ${key}`);
      values.set(key, value);
    } else if (['--force', '--resume', '--dry-run', '--help'].includes(key)) {
      if (inline === undefined || inline === 'true') flags.add(key);
      else if (inline !== 'false') throw Error(`Invalid value for ${key}`);
    } else throw Error(`Unknown option: ${key}`);
  }
  if (flags.has('--force') && flags.has('--resume'))
    throw Error('Choose --force or --resume');
  if (
    values.has('--workers') &&
    !/^[1-9][0-9]*$/.test(values.get('--workers') ?? '')
  )
    throw Error('--workers must be a positive integer');
  const root = resolve(
    values.get('--root') ??
      process.env.AEREALITH_DATA_ROOT ??
      join(workspace, 'data'),
  );
  const command = [
    'run',
    '--frozen',
    '--extra',
    'pdf',
    '--extra',
    'raw',
    'aerealith-core',
    'ingest',
    '--input',
    resolve(values.get('--input') ?? join(root, 'raw')),
    '--output',
    resolve(values.get('--output') ?? join(root, 'processed')),
  ];
  for (const option of ['--config', '--workers']) {
    const value = values.get(option);
    if (value)
      command.push(option, option === '--config' ? resolve(value) : value);
  }
  command.push(flags.has('--force') ? '--force' : '--resume');
  return command;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(
      'Process raw data into training JSONL and a resume/dedup manifest.\n--root PATH --input PATH --output PATH --config PATH --workers N --resume --force --dry-run\nDefaults: repository data/raw -> data/processed; resume enabled. --force rebuilds processed output.',
    );
    return;
  }
  const command = processingArgs(args);
  if (args.some((arg) => arg === '--dry-run' || arg === '--dry-run=true')) {
    console.log(
      JSON.stringify(
        {
          cwd: join(workspace, 'apps/aerealith-core'),
          executable: 'uv',
          args: command,
        },
        null,
        2,
      ),
    );
    return;
  }
  const child = spawn('uv', command, {
    cwd: join(workspace, 'apps/aerealith-core'),
    stdio: 'inherit',
  });
  for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.once(signal, () => child.kill(signal));
  await new Promise<void>((done, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      process.exitCode = code ?? (signal ? 1 : 0);
      done();
    });
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
