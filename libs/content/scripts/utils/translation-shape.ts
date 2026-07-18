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
    compareArray(source, translation, path, result)
    return
  }

  if (isObject(source)) {
    compareObject(source, translation, path, result)
    return
  }

  comparePreservedValue(source, translation, path, result)
}

function compareArray(
  source: unknown[],
  translation: unknown,
  path: string,
  result: TranslationValidationResult,
): void {
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
}

function compareObject(
  source: Record<string, unknown>,
  translation: unknown,
  path: string,
  result: TranslationValidationResult,
): void {
  if (!isObject(translation)) {
    result.errors.push(`${path}: expected an object`)
    return
  }

  compareObjectEntries(source, translation, path, result)
  reportUnknownKeys(source, translation, path, result)
}

function compareObjectEntries(
  source: Record<string, unknown>,
  translation: Record<string, unknown>,
  path: string,
  result: TranslationValidationResult,
): void {
  for (const key of Object.keys(source)) {
    const childPath = joinPath(path, key)
    if (key in translation) {
      compareNode(source[key], translation[key], childPath, result)
    } else {
      result.errors.push(`${childPath}: missing key`)
    }
  }
}

function reportUnknownKeys(
  source: Record<string, unknown>,
  translation: Record<string, unknown>,
  path: string,
  result: TranslationValidationResult,
): void {
  for (const key of Object.keys(translation)) {
    if (!(key in source)) {
      result.errors.push(`${joinPath(path, key)}: unknown key`)
    }
  }
}

function comparePreservedValue(
  source: unknown,
  translation: unknown,
  path: string,
  result: TranslationValidationResult,
): void {
  if (source === translation) return

  result.errors.push(
    `${path}: expected preserved value ${JSON.stringify(source)}, received ${JSON.stringify(translation)}`,
  )
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
