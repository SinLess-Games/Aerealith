import { exportEnglishJson } from './export-english-json'
import { generateLocales } from './generate-locale-ts'
import {
  printValidationSummaries,
  validateTranslations,
} from './validate-translations'

async function main() {
  await exportEnglishJson()
  const summaries = await validateTranslations()
  if (!printValidationSummaries(summaries)) {
    process.exitCode = 1
  } else {
    const files = await generateLocales()
    console.log(
      `Synchronized English JSON and ${files.length} generated locale module${files.length === 1 ? '' : 's'}.`,
    )
  }
}

if (process.argv[1]?.endsWith('sync-translations.ts')) void main()
