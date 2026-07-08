import { readdir } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

const workingDirectory = process.cwd();
export const CONTENT_ROOT =
  basename(workingDirectory) === 'content' &&
  basename(dirname(workingDirectory)) === 'libs'
    ? workingDirectory
    : resolve(workingDirectory, 'libs/content');
export const TRANSLATIONS_ROOT = join(CONTENT_ROOT, 'translations');
export const GENERATED_LOCALES_ROOT = join(
  CONTENT_ROOT,
  'src/generated/locales',
);

export const TRANSLATION_NAMESPACES = [
  'about',
  'contact',
  'footer',
  'home',
  'policies',
  'profile',
] as const;

export type TranslationNamespace = (typeof TRANSLATION_NAMESPACES)[number];

export async function listTranslationLocales(): Promise<string[]> {
  try {
    const entries = await readdir(TRANSLATIONS_ROOT, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if (isMissingFileError(error)) return [];
    throw error;
  }
}

export function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}
