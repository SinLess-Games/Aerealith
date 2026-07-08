import { access } from 'node:fs/promises'
import { join } from 'node:path'

import { generateLocales } from './generate-locale-ts'
import { TRANSLATIONS_ROOT } from './utils/collect-content'
import {
  printValidationSummaries,
  validateTranslations,
} from './validate-translations'

function localeArgument(): string | undefined {
  const argument = process.argv
    .slice(2)
    .find((value) => value.startsWith('--locale='))
  return argument?.slice('--locale='.length)
}

export async function importTranslatedJson(locale: string): Promise<void> {
  await access(join(TRANSLATIONS_ROOT, locale))
  const summaries = await validateTranslations(locale)
  if (!printValidationSummaries(summaries)) {
    throw new Error(`Translation validation failed for ${locale}.`)
  }
  await generateLocales(locale)
  console.log(`Imported translated JSON for ${locale}.`)
}

async function main() {
  const locale = localeArgument()
  if (!locale) {
    console.error(
      'Usage: pnpm tsx libs/content/scripts/import-translated-json.ts --locale=es',
    )
    process.exitCode = 1
    return
  }
  try {
    await importTranslatedJson(locale)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

if (process.argv[1]?.endsWith('import-translated-json.ts')) void main()
