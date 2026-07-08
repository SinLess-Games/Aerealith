import { join } from 'node:path'

import { englishContent } from '../src/en'
import {
  TRANSLATIONS_ROOT,
  TRANSLATION_NAMESPACES,
} from './utils/collect-content'
import { writeJson } from './utils/json'

export async function exportEnglishJson(): Promise<string[]> {
  const writtenFiles: string[] = []
  for (const namespace of TRANSLATION_NAMESPACES) {
    const path = join(TRANSLATIONS_ROOT, 'en', `${namespace}.json`)
    await writeJson(path, englishContent[namespace])
    writtenFiles.push(path)
  }
  return writtenFiles
}

async function main() {
  const files = await exportEnglishJson()
  console.log(`Exported ${files.length} English translation files.`)
}

if (process.argv[1]?.endsWith('export-english-json.ts')) void main()
