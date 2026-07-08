import { englishContent } from '../en'
import { generatedContentLocales } from '../generated/locales'
import {
  isSupportedLocale,
  supportedLocales,
  type SupportedLocale,
} from './locale-types'
import type { TranslationContent } from './translation-types'

export const contentLocales: Readonly<Record<string, TranslationContent>> = {
  'en-US': englishContent,
  ...generatedContentLocales,
} as const

export type AvailableContentLocale = SupportedLocale

/** Returns compiled locale content, falling back to canonical English. */
export function getContentForLocale(
  locale: SupportedLocale,
): TranslationContent {
  return (
    (contentLocales as Partial<Record<SupportedLocale, TranslationContent>>)[
      locale
    ] ?? englishContent
  )
}

export function resolveSupportedLocale(locale: string): SupportedLocale {
  if (isSupportedLocale(locale)) return locale
  const language = locale.split('-')[0]
  return (
    (Object.keys(supportedLocales) as SupportedLocale[]).find(
      (candidate) => candidate.split('-')[0] === language,
    ) ?? 'en-US'
  )
}
