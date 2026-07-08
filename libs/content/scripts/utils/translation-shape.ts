import { collectPlaceholders, collectUrls } from './placeholders'

export interface TranslationValidationResult {
  errors: string[]
  warnings: string[]
}

const PRESERVED_STRING_KEYS = new Set([
  'component',
  'href',
  'id',
  'image',
  'imageUrl',
  'path',
  'poster',
  'slug',
  'src',
  'type',
  'value',
])

const ACCESSIBILITY_KEYS = new Set([
  'alt',
  'ariaDescription',
  'ariaLabel',
  'label',
  'title',
])

export function validateTranslationShape(
  source: unknown,
  translation: unknown,
  rootPath = '',
): TranslationValidationResult {
  const result: TranslationValidationResult = { errors: [], warnings: [] }
  compareNode(source, translation, rootPath, result)
  return result
}

function compareNode(
  source: unknown,
  translation: unknown,
  path: string,
  result: TranslationValidationResult,
): void {
  if (typeof source === 'string') {
    compareString(source, translation, path, result)
    return
  }

  if (Array.isArray(source)) {
    if (!Array.isArray(translation)) {
      result.errors.push(`${path}: expected an array`)
      return
    }
    if (source.length !== translation.length) {
      result.errors.push(
        `${path}: expected ${source.length} items, received ${translation.length}`,
      )
    }
    const sharedLength = Math.min(source.length, translation.length)
    for (let index = 0; index < sharedLength; index += 1) {
      compareNode(
        source[index],
        translation[index],
        joinPath(path, `${index}`),
        result,
      )
    }
    return
  }

  if (isObject(source)) {
    if (!isObject(translation)) {
      result.errors.push(`${path}: expected an object`)
      return
    }
    const sourceKeys = Object.keys(source)
    const translationKeys = Object.keys(translation)
    for (const key of sourceKeys) {
      const childPath = joinPath(path, key)
      if (!(key in translation)) result.errors.push(`${childPath}: missing key`)
      else compareNode(source[key], translation[key], childPath, result)
    }
    for (const key of translationKeys) {
      if (!(key in source)) {
        result.errors.push(`${joinPath(path, key)}: unknown key`)
      }
    }
    return
  }

  if (source !== translation) {
    result.errors.push(
      `${path}: expected preserved value ${JSON.stringify(source)}, received ${JSON.stringify(translation)}`,
    )
  }
}

function compareString(
  source: string,
  translation: unknown,
  path: string,
  result: TranslationValidationResult,
): void {
  if (typeof translation !== 'string') {
    result.errors.push(`${path}: expected a string`)
    return
  }
  const key = path.split('.').at(-1) ?? ''
  if (PRESERVED_STRING_KEYS.has(key) && source !== translation) {
    result.errors.push(`${path}: non-translatable value must remain unchanged`)
  }
  if (ACCESSIBILITY_KEYS.has(key) && translation.trim().length === 0) {
    result.warnings.push(`${path}: accessibility text is empty`)
  }
  compareTokens(
    collectPlaceholders(source),
    collectPlaceholders(translation),
    path,
    'placeholder',
    result,
  )
  compareTokens(
    collectUrls(source),
    collectUrls(translation),
    path,
    'URL',
    result,
  )
}

function compareTokens(
  source: string[],
  translation: string[],
  path: string,
  kind: string,
  result: TranslationValidationResult,
): void {
  if (JSON.stringify(source) !== JSON.stringify(translation)) {
    result.errors.push(
      `${path}: ${kind} tokens differ (expected ${JSON.stringify(source)}, received ${JSON.stringify(translation)})`,
    )
  }
}

function joinPath(parent: string, child: string): string {
  return parent ? `${parent}.${child}` : child
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
