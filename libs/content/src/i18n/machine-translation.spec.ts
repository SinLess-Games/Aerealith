import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { generateLocale } from '../../scripts/generate-locale-ts'
import type { TranslationProvider } from '../../scripts/providers/translation-provider'
import { translateLocale } from '../../scripts/translation-workflow'
import { parseTranslationArguments } from '../../scripts/translate-json'
import { TRANSLATION_NAMESPACES } from '../../scripts/utils/collect-content'
import { providerCodeForLocale } from '../../scripts/utils/locale-provider-map'
import { protectContent } from '../../scripts/utils/protected-content'
import { readJson, writeJson } from '../../scripts/utils/json'
import {
  sourceTextHash,
  TranslationCache,
} from '../../scripts/utils/translation-cache'
import { isTranslatableString } from '../../scripts/utils/translatable-values'
import { validateTranslationShape } from '../../scripts/utils/translation-shape'

const temporaryDirectories: string[] = []

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  )
})

describe('machine translation workflow', () => {
  it('treats a no-argument translation command as all locales', () => {
    expect(parseTranslationArguments([]).locales).toHaveLength(25)
    expect(
      parseTranslationArguments(['--locale=es-ES', '--force', '--dry-run']),
    ).toEqual({ locales: ['es-ES'], force: true, dryRun: true })
  })

  it('rejects conflicting, fallback, provider, and unsupported arguments', () => {
    expect(() =>
      parseTranslationArguments(['--all', '--locale=es-ES']),
    ).toThrow('Usage:')
    expect(() => parseTranslationArguments(['--allow-fallback'])).toThrow(
      'Fallback translations are disabled',
    )
    expect(() => parseTranslationArguments(['--provider'])).toThrow(
      'Only --provider=libretranslate',
    )
    expect(() => parseTranslationArguments(['--provider=google'])).toThrow(
      'Only --provider=libretranslate',
    )
    expect(() => parseTranslationArguments(['--locale=en-US'])).toThrow(
      'Unsupported target locale',
    )
    expect(() => parseTranslationArguments(['--locale=xx-XX'])).toThrow(
      'Unsupported target locale',
    )
    expect(
      parseTranslationArguments(['--provider=libretranslate']).locales,
    ).toHaveLength(25)
  })

  it('maps every representative app locale to its provider code', () => {
    expect(providerCodeForLocale('en-US')).toBe('en')
    expect(providerCodeForLocale('pt-BR')).toBe('pt')
    expect(providerCodeForLocale('zh-CN')).toBe('zh-Hans')
    expect(providerCodeForLocale('zh-TW')).toBe('zh-Hant')
    expect(providerCodeForLocale('he-IL')).toBe('he')
  })

  it('fails unsupported locales without writing fallback content', async () => {
    const root = await fixtureRoot()
    await expect(
      translateLocale({
        locale: 'nb-NO',
        provider: mockProvider(),
        supportedLanguages: new Set(['en', 'es']),
        cache: new TranslationCache(join(root, 'cache.json')),
        translationsRoot: join(root, 'translations'),
      }),
    ).rejects.toThrow(/not installed/i)
    await expect(
      readFile(join(root, 'translations/nb-NO/translation.meta.json')),
    ).rejects.toThrow()
  })

  it('protects placeholders, URLs, and product terms', () => {
    const source =
      'Aerealith AI: visit https://aerealith.ai for {{name}} using <Link>GitHub</Link>.'
    const protectedText = protectContent(source)
    expect(protectedText.text).not.toContain('Aerealith AI')
    expect(protectedText.restore(protectedText.text)).toBe(source)
    expect(protectedText.restore(protectedText.text.toLowerCase())).toBe(source)
  })

  it('returns cached translations for unchanged source text', async () => {
    const root = await fixtureRoot()
    const path = join(root, 'cache.json')
    const cache = new TranslationCache(path)
    cache.set('libretranslate', 'en', 'es', 'Hello', 'Hola')
    await cache.save()
    const reloaded = new TranslationCache(path)
    await reloaded.load()
    expect(reloaded.get('libretranslate', 'en', 'es', 'Hello')).toBe('Hola')
    expect(reloaded.get('libretranslate', 'en', 'fr', 'Hello')).toBeUndefined()
    expect(sourceTextHash('Hello')).toHaveLength(64)
  })

  it('handles missing and malformed translation cache files', async () => {
    const root = await fixtureRoot()
    await expect(
      new TranslationCache(join(root, 'missing.json')).load(),
    ).resolves.toBeUndefined()
    await writeFile(join(root, 'invalid.json'), '{not-json', 'utf8')
    await expect(
      new TranslationCache(join(root, 'invalid.json')).load(),
    ).rejects.toThrow()
  })

  it('refuses to write JSON content to non-JSON files', async () => {
    const root = await fixtureRoot()
    await expect(
      writeJson(join(root, 'translation.ts'), { title: 'Untrusted content' }),
    ).rejects.toThrow('Refusing to write JSON to a non-JSON path')
    await expect(readFile(join(root, 'translation.ts'))).rejects.toThrow()
  })

  it('only translates meaningful user-facing strings', () => {
    expect(isTranslatableString('   ', 'title')).toBe(false)
    expect(isTranslatableString('fixed-id', 'id')).toBe(false)
    expect(isTranslatableString('https://aerealith.ai', 'title')).toBe(false)
    expect(isTranslatableString('identifier', 'title')).toBe(false)
    expect(isTranslatableString('12345', 'title')).toBe(false)
    expect(isTranslatableString('Visible title', 'title')).toBe(true)
  })

  it('preserves shape, validates output, and generates locale TypeScript', async () => {
    const root = await fixtureRoot()
    const translationsRoot = join(root, 'translations')
    const generatedRoot = join(root, 'generated')
    await writeEnglishFixture(translationsRoot)
    const provider = mockProvider()
    const validate = async (locale: string) => {
      const errors: string[] = []
      for (const namespace of TRANSLATION_NAMESPACES) {
        const source = await readJson(
          join(translationsRoot, 'en', `${namespace}.json`),
        )
        const translated = await readJson(
          join(translationsRoot, locale, `${namespace}.json`),
        )
        errors.push(
          ...validateTranslationShape(source, translated, namespace).errors,
        )
      }
      return { errors }
    }
    const result = await translateLocale({
      locale: 'es-ES',
      provider,
      supportedLanguages: new Set(['en', 'es']),
      cache: new TranslationCache(join(root, 'cache.json')),
      translationsRoot,
      validate,
      generate: async (locale) =>
        generateLocale(locale, {
          translationsRoot,
          generatedLocalesRoot: generatedRoot,
        }),
    })
    expect(result.translatedStrings).toBeGreaterThan(0)
    expect(await validate('es-ES')).toEqual({ errors: [] })
    expect(
      await readFile(join(generatedRoot, 'es-ES/index.ts'), 'utf8'),
    ).toContain('export const esESContent =')
  })
})

function mockProvider(): TranslationProvider {
  return {
    name: 'libretranslate',
    getSupportedLanguages: vi.fn(async () => new Set(['en', 'es'])),
    translateText: vi.fn(async ({ text }) => `Traducido: ${text}`),
  }
}

async function fixtureRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'aerealith-translation-'))
  temporaryDirectories.push(root)
  return root
}

async function writeEnglishFixture(translationsRoot: string): Promise<void> {
  for (const namespace of TRANSLATION_NAMESPACES) {
    await writeJson(join(translationsRoot, 'en', `${namespace}.json`), {
      id: `${namespace}-content`,
      title: `English ${namespace} title`,
      body: 'Aerealith AI helps {{name}}. Visit https://aerealith.ai.',
    })
  }
}
