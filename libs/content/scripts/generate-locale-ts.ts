import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
  GENERATED_LOCALES_ROOT,
  TRANSLATIONS_ROOT,
  TRANSLATION_NAMESPACES,
  listTranslationLocales,
} from './utils/collect-content'
import {
  formatLocaleModule,
  localeExportName,
} from './utils/format-generated-ts'
import { readJson } from './utils/json'

export interface LocaleGenerationPaths {
  translationsRoot?: string
  generatedLocalesRoot?: string
}

export async function generateLocale(
  locale: string,
  paths: LocaleGenerationPaths = {},
): Promise<string> {
  const translationsRoot = paths.translationsRoot ?? TRANSLATIONS_ROOT
  const generatedLocalesRoot =
    paths.generatedLocalesRoot ?? GENERATED_LOCALES_ROOT
  const content = Object.fromEntries(
    await Promise.all(
      TRANSLATION_NAMESPACES.map(async (namespace) => [
        namespace,
        await readJson(join(translationsRoot, locale, `${namespace}.json`)),
      ]),
    ),
  )
  const outputPath = join(generatedLocalesRoot, locale, 'index.ts')
  await mkdir(join(generatedLocalesRoot, locale), { recursive: true })
  await writeFile(outputPath, formatLocaleModule(locale, content), 'utf8')
  return outputPath
}

export async function generateLocales(
  requestedLocale?: string,
): Promise<string[]> {
  const locales = requestedLocale
    ? [requestedLocale]
    : (await listTranslationLocales()).filter((locale) => locale !== 'en')
  const files = await Promise.all(
    locales.map((locale) => generateLocale(locale)),
  )
  await writeGeneratedRegistry(locales)
  return files
}

async function writeGeneratedRegistry(locales: readonly string[]) {
  const imports = locales
    .map(
      (locale) => `import { ${localeExportName(locale)} } from './${locale}'`,
    )
    .join('\n')
  const entries = locales
    .map(
      (locale) => `  ${JSON.stringify(locale)}: ${localeExportName(locale)},`,
    )
    .join('\n')
  const output = `/** GENERATED FILE. Do not edit manually. */
import type { TranslationContent } from '../../i18n/translation-types'
${imports ? `\n${imports}` : ''}

export const generatedContentLocales: Readonly<Record<string, TranslationContent>> = {
${entries}${entries ? '\n' : ''}} as const
`
  await mkdir(GENERATED_LOCALES_ROOT, { recursive: true })
  await writeFile(join(GENERATED_LOCALES_ROOT, 'index.ts'), output, 'utf8')
}

async function main() {
  const files = await generateLocales()
  console.log(
    `Generated ${files.length} locale TypeScript module${files.length === 1 ? '' : 's'}.`,
  )
}

if (process.argv[1]?.endsWith('generate-locale-ts.ts')) void main()
