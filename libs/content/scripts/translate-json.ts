import { join } from 'node:path'

import {
  supportedLocales,
  sourceLocale,
  isSupportedLocale,
  type SupportedLocale,
} from '../src/i18n/locale-types'
import { exportEnglishJson } from './export-english-json'
import { generateLocales } from './generate-locale-ts'
import { LibreTranslateProvider } from './providers/libretranslate.provider'
import { translateLocale } from './translation-workflow'
import { CONTENT_ROOT } from './utils/collect-content'
import { TranslationCache } from './utils/translation-cache'

export interface TranslationArguments {
  locales: Exclude<SupportedLocale, 'en-US'>[]
  force: boolean
  dryRun: boolean
}

export async function runTranslation(
  args: TranslationArguments,
): Promise<void> {
  await exportEnglishJson()
  const provider = new LibreTranslateProvider()
  const languages = await provider.getSupportedLanguages()
  const cache = new TranslationCache(
    join(CONTENT_ROOT, '.translation-cache/libretranslate.json'),
  )
  await cache.load()
  const results = []
  for (const locale of args.locales) {
    results.push(
      await translateLocale({
        locale,
        provider,
        supportedLanguages: languages,
        cache,
        force: args.force,
        dryRun: args.dryRun,
        providerUrl: provider.baseUrl,
        generate: async () => undefined,
      }),
    )
    if (!args.dryRun) await cache.save()
  }
  if (!args.dryRun) await generateLocales()
  console.log(`Provider: ${provider.name} (${provider.baseUrl})`)
  console.log(
    `Locales requested: ${args.locales.length}; translated: ${results.length}`,
  )
  console.log(
    `Cache hits: ${results.reduce((total, result) => total + result.cacheHits, 0)}; translated strings: ${results.reduce((total, result) => total + result.translatedStrings, 0)}; files written: ${results.reduce((total, result) => total + result.filesWritten, 0)}`,
  )
}

export function parseTranslationArguments(
  values: string[],
): TranslationArguments {
  const localeValue = values
    .find((value) => value.startsWith('--locale='))
    ?.slice(9)
  const all = values.includes('--all')
  if (localeValue && all)
    throw new Error(
      'Usage: translate-json.ts --locale=es-ES | --all [--force] [--dry-run]',
    )
  if (values.includes('--allow-fallback'))
    throw new Error('Fallback translations are disabled.')
  if (
    values.includes('--provider') ||
    values.some(
      (value) =>
        value.startsWith('--provider=') &&
        value !== '--provider=libretranslate',
    )
  )
    throw new Error('Only --provider=libretranslate is supported.')
  if (
    localeValue &&
    (!isSupportedLocale(localeValue) || localeValue === sourceLocale)
  )
    throw new Error(`Unsupported target locale: ${localeValue}`)
  const locales = (
    all || !localeValue
      ? Object.keys(supportedLocales).filter(
          (locale) => locale !== sourceLocale,
        )
      : [localeValue]
  ) as Exclude<SupportedLocale, 'en-US'>[]
  return {
    locales,
    force: values.includes('--force'),
    dryRun: values.includes('--dry-run'),
  }
}

async function main() {
  try {
    await runTranslation(parseTranslationArguments(process.argv.slice(2)))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

if (process.argv[1]?.endsWith('translate-json.ts')) void main()
