export function localeExportName(locale: string): string {
  const parts = locale.split(/[^A-Za-z0-9]+/).filter(Boolean)
  const [first = 'locale', ...rest] = parts
  const identifier = `${first.toLowerCase()}${rest
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')}`
  const safeIdentifier = /^\d/.test(identifier)
    ? `locale${identifier}`
    : identifier
  return `${safeIdentifier}Content`
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
`
}
