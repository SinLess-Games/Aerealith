import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export class TranslationCache {
  private readonly entries = new Map<string, string>();
  constructor(readonly path: string) {}

  async load(): Promise<void> {
    try {
      const stored = JSON.parse(await readFile(this.path, 'utf8')) as Record<
        string,
        string
      >;
      for (const [key, value] of Object.entries(stored))
        this.entries.set(key, value);
    } catch (error) {
      if (!(
        error instanceof Error &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ))
        throw error;
    }
  }

  get(
    provider: string,
    source: string,
    target: string,
    text: string,
  ): string | undefined {
    return this.entries.get(cacheKey(provider, source, target, text));
  }

  set(
    provider: string,
    source: string,
    target: string,
    text: string,
    translation: string,
  ): void {
    this.entries.set(cacheKey(provider, source, target, text), translation);
  }

  async save(): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const sorted = Object.fromEntries(
      [...this.entries].sort(([left], [right]) => left.localeCompare(right)),
    );
    await writeFile(this.path, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
  }
}

export function sourceTextHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function cacheKey(
  provider: string,
  source: string,
  target: string,
  text: string,
): string {
  return `${provider}:${source}:${target}:${sourceTextHash(text)}`;
}
