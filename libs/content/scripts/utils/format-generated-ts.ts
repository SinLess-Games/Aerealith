export function localeExportName(locale: string): string {
  const parts = locale.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const [first = 'locale', ...rest] = parts;
  const identifier = `${first.toLowerCase()}${rest
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')}`;
  return `${/^\d/.test(identifier) ? `locale${identifier}` : identifier}Content`;
}

export function formatLocaleModule(locale: string, content: unknown): string {
  return `/**
 * GENERATED FILE.
 *
 * Source:
 * libs/content/translations/${locale}
 *
 * Do not edit manually.
 */

import type { TranslationContent } from '../../../i18n/translation-types'

export const ${localeExportName(locale)} = ${JSON.stringify(content, null, 2)} as const satisfies TranslationContent
`;
}

export function formatFallbackLocaleModule(locale: string): string {
  return `/**
 * GENERATED FILE — ENGLISH FALLBACK.
 *
 * No validated JSON exists for ${locale} yet. This module intentionally uses
 * canonical en-US content until translations are imported.
 *
 * Do not edit manually.
 */

import { englishContent } from '../../../en'
import type { TranslationContent } from '../../../i18n/translation-types'

export const ${localeExportName(locale)}: TranslationContent = englishContent
`;
}
