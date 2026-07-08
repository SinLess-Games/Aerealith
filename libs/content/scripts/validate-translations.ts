import { join } from 'node:path';

import {
  TRANSLATIONS_ROOT,
  TRANSLATION_NAMESPACES,
  isMissingFileError,
  listTranslationLocales,
} from './utils/collect-content';
import { readJson } from './utils/json';
import { validateTranslationShape } from './utils/translation-shape';

export interface LocaleValidationSummary {
  locale: string;
  errors: string[];
  warnings: string[];
}

export async function validateLocale(
  locale: string,
): Promise<LocaleValidationSummary> {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const namespace of TRANSLATION_NAMESPACES) {
    const sourcePath = join(TRANSLATIONS_ROOT, 'en', `${namespace}.json`);
    const translatedPath = join(TRANSLATIONS_ROOT, locale, `${namespace}.json`);
    try {
      const [source, translation] = await Promise.all([
        readJson(sourcePath),
        readJson(translatedPath),
      ]);
      const result = validateTranslationShape(source, translation, namespace);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    } catch (error) {
      if (isMissingFileError(error)) {
        errors.push(`${namespace}: missing ${locale}/${namespace}.json`);
      } else {
        errors.push(
          `${namespace}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  return { locale, errors, warnings };
}

export async function validateTranslations(
  requestedLocale?: string,
): Promise<LocaleValidationSummary[]> {
  const locales = requestedLocale
    ? [requestedLocale]
    : (await listTranslationLocales()).filter((locale) => locale !== 'en');
  return Promise.all(locales.map((locale) => validateLocale(locale)));
}

export function printValidationSummaries(
  summaries: readonly LocaleValidationSummary[],
): boolean {
  for (const summary of summaries) {
    for (const warning of summary.warnings) {
      console.warn(`[${summary.locale}] warning: ${warning}`);
    }
    for (const error of summary.errors) {
      console.error(`[${summary.locale}] ${error}`);
    }
  }
  const errorCount = summaries.reduce(
    (count, summary) => count + summary.errors.length,
    0,
  );
  console.log(
    `Validated ${summaries.length} translated locale${summaries.length === 1 ? '' : 's'}; ${errorCount} error${errorCount === 1 ? '' : 's'}.`,
  );
  return errorCount === 0;
}

async function main() {
  const valid = printValidationSummaries(await validateTranslations());
  if (!valid) process.exitCode = 1;
}

if (process.argv[1]?.endsWith('validate-translations.ts')) void main();
