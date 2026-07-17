import { join } from 'node:path'

import type { SupportedLocale } from '../src/i18n/locale-types'
import type { TranslationProvider } from './providers/translation-provider'
import { generateLocales } from './generate-locale-ts'
import {
  TRANSLATIONS_ROOT,
  TRANSLATION_NAMESPACES,
} from './utils/collect-content'
import { providerCodeForLocale } from './utils/locale-provider-map'
import { readJson, writeJson } from './utils/json'
import { sourceTextHash, TranslationCache } from './utils/translation-cache'
import type { TranslationMetadata } from './utils/translation-metadata'
import {
  translateValues,
  type TranslationCounters,
} from './utils/translatable-values'
import { validateLocale } from './validate-translations'

export interface TranslateLocaleOptions {
  locale: Exclude<SupportedLocale, 'en-US'>
  provider: TranslationProvider
  supportedLanguages: ReadonlySet<string>
  cache: TranslationCache
  force?: boolean
  dryRun?: boolean
  providerUrl?: string
  now?: () => Date
  generate?: (locale: string) => Promise<unknown>
  translationsRoot?: string
  validate?: (locale: string) => Promise<{ errors: string[] }>
}

export interface TranslateLocaleResult extends TranslationCounters {
  locale: string
  filesWritten: number
}

export async function translateLocale(
  options: TranslateLocaleOptions,
): Promise<TranslateLocaleResult> {
  const translationsRoot = options.translationsRoot ?? TRANSLATIONS_ROOT
  const targetLanguage = providerCodeForLocale(options.locale)
  const sourceLanguage = providerCodeForLocale('en-US')
  const supported = options.supportedLanguages.has(targetLanguage)
  if (!supported) {
    throw new Error(
      `LibreTranslate target language ${targetLanguage} is not installed for ${options.locale}. Restart LibreTranslate so it can update the configured models, or set LIBRETRANSLATE_LOAD_LANGUAGES to include ${targetLanguage}.`,
    )
  }
  const counters: TranslationCounters = { cacheHits: 0, translatedStrings: 0 }
  const sourceByNamespace = Object.fromEntries(
    await Promise.all(
      TRANSLATION_NAMESPACES.map(async (namespace) => [
        namespace,
        await readJson(join(translationsRoot, 'en', `${namespace}.json`)),
      ]),
    ),
  )
  const sourceHash = sourceTextHash(JSON.stringify(sourceByNamespace))
  const outputByNamespace: Record<string, unknown> = {}
  for (const namespace of TRANSLATION_NAMESPACES) {
    outputByNamespace[namespace] = await translateValues({
      value: sourceByNamespace[namespace],
      provider: options.provider,
      sourceLanguage,
      targetLanguage,
      cache: options.cache,
      force: options.force,
      path: namespace,
      counters,
    })
  }
  if (options.dryRun)
    return {
      locale: options.locale,
      filesWritten: 0,
      ...counters,
    }

  for (const namespace of TRANSLATION_NAMESPACES) {
    await writeJson(
      join(translationsRoot, options.locale, `${namespace}.json`),
      outputByNamespace[namespace],
    )
  }
  const metadata: TranslationMetadata = {
    locale: options.locale,
    sourceLocale: 'en-US',
    provider: options.provider.name,
    providerUrl: options.providerUrl,
    status: 'machine_translated',
    sourceHash,
    translatedAt: (options.now?.() ?? new Date()).toISOString(),
    fallback: false,
  }
  await writeJson(
    join(translationsRoot, options.locale, 'translation.meta.json'),
    metadata,
  )
  const validation = await (options.validate ?? validateLocale)(options.locale)
  if (validation.errors.length)
    throw new Error(
      `Generated translation failed validation:\n${validation.errors.join('\n')}`,
    )
  await (options.generate ?? ((locale) => generateLocales(locale)))(
    options.locale,
  )
  return {
    locale: options.locale,
    filesWritten: TRANSLATION_NAMESPACES.length + 1,
    ...counters,
  }
}
