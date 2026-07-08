import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, expectTypeOf, it } from 'vitest'

import { englishContent, type EnglishContent } from '../en'
import type { TranslationContent } from './translation-types'
import { contentLocales } from './translation-registry'
import {
  CONTENT_ROOT,
  TRANSLATION_NAMESPACES,
} from '../../scripts/utils/collect-content'
import { collectPlaceholders } from '../../scripts/utils/placeholders'
import {
  formatLocaleModule,
  localeExportName,
} from '../../scripts/utils/format-generated-ts'
import { validateTranslationShape } from '../../scripts/utils/translation-shape'

describe('translation system', () => {
  it('registers the expected canonical English namespaces', () => {
    expect(Object.keys(englishContent)).toEqual([
      'about',
      'contact',
      'footer',
      'home',
      'policies',
      'profile',
    ])
    expect(contentLocales['en-US']).toBe(englishContent)
    expectTypeOf(englishContent).toMatchTypeOf<TranslationContent>()
    expectTypeOf<EnglishContent>().toMatchTypeOf<TranslationContent>()
  })

  it('keeps exported English JSON synchronized with English content', async () => {
    for (const namespace of TRANSLATION_NAMESPACES) {
      const json = JSON.parse(
        await readFile(
          join(CONTENT_ROOT, 'translations/en', `${namespace}.json`),
          'utf8',
        ),
      ) as unknown
      expect(json).toEqual(englishContent[namespace])
    }
  })

  it('reports missing and unknown keys with actionable paths', () => {
    const missing = validateTranslationShape(
      { hero: { title: 'Hello' } },
      { hero: {} },
      'home',
    )
    expect(missing.errors).toContain('home.hero.title: missing key')

    const unknown = validateTranslationShape(
      { hero: { title: 'Hello' } },
      { hero: { title: 'Hola', extra: true } },
      'home',
    )
    expect(unknown.errors).toContain('home.hero.extra: unknown key')
  })

  it('detects changed interpolation and rich-text placeholders', () => {
    const result = validateTranslationShape(
      { message: 'Hello {{name}} {serverId} <Link><0>open</0></Link>' },
      { message: 'Hola {{user}} {serverId} <Link><0>abrir</Link></0>' },
      'home',
    )
    expect(result.errors[0]).toContain(
      'home.message: placeholder tokens differ',
    )
    expect(collectPlaceholders('{{count}}')).toEqual(['{{count}}'])
  })

  it('preserves URLs embedded in translated strings', () => {
    const result = validateTranslationShape(
      { body: 'Visit https://aerealith.ai/docs for {{name}}.' },
      { body: 'Visita https://example.com/docs para {{name}}.' },
      'home',
    )
    expect(result.errors).toContainEqual(
      expect.stringContaining('URL tokens differ'),
    )
  })

  it('generates safe, typed locale modules', () => {
    expect(localeExportName('pt-BR')).toBe('ptBRContent')
    const module = formatLocaleModule('es', englishContent)
    expect(module).toContain('export const esContent =')
    expect(module).toContain('as const satisfies TranslationContent')
    expect(module.endsWith('\n')).toBe(true)
  })
})
