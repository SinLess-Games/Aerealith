import { protectContent } from './protected-content'
import type { TranslationProvider } from '../providers/translation-provider'
import type { TranslationCache } from './translation-cache'

const PRESERVED_KEYS = new Set([
  'component',
  'href',
  'id',
  'image',
  'imageUrl',
  'icon',
  'path',
  'poster',
  'slug',
  'src',
  'type',
  'value',
])
const URL_OR_PATH = /^(?:\/|https?:\/\/|mailto:|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/
const IDENTIFIER = /^[a-z][a-z0-9_-]*$/

export interface TranslationCounters {
  cacheHits: number
  translatedStrings: number
}

export async function translateValues(input: {
  value: unknown
  provider: TranslationProvider
  sourceLanguage: string
  targetLanguage: string
  cache: TranslationCache
  force?: boolean
  path?: string
  counters: TranslationCounters
}): Promise<unknown> {
  const { value, path = '' } = input
  if (Array.isArray(value)) {
    return Promise.all(
      value.map((item, index) =>
        translateValues({
          ...input,
          value: item,
          path: join(path, `${index}`),
        }),
      ),
    )
  }
  if (isObject(value)) {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(value).map(async ([key, child]) => [
          key,
          await translateValues({
            ...input,
            value: child,
            path: join(path, key),
          }),
        ]),
      ),
    )
  }
  if (typeof value !== 'string' || !isTranslatableString(value, path))
    return value
  const cached = input.force
    ? undefined
    : input.cache.get(
        input.provider.name,
        input.sourceLanguage,
        input.targetLanguage,
        value,
      )
  if (cached !== undefined) {
    input.counters.cacheHits += 1
    return cached
  }
  const protectedText = protectContent(value)
  const translated = protectedText.restore(
    await input.provider.translateText({
      text: protectedText.text,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      context: path,
    }),
  )
  input.cache.set(
    input.provider.name,
    input.sourceLanguage,
    input.targetLanguage,
    value,
    translated,
  )
  input.counters.translatedStrings += 1
  return translated
}

export function isTranslatableString(value: string, path: string): boolean {
  const key = path.split('.').at(-1) ?? ''
  if (!value.trim() || PRESERVED_KEYS.has(key) || URL_OR_PATH.test(value))
    return false
  if (IDENTIFIER.test(value) && !value.includes(' ')) return false
  return /[A-Za-z\p{L}]/u.test(value)
}

function join(parent: string, child: string): string {
  return parent ? `${parent}.${child}` : child
}
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
