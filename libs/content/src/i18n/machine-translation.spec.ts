import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateLocale } from '../../scripts/generate-locale-ts';
import type { TranslationProvider } from '../../scripts/providers/translation-provider';
import { translateLocale } from '../../scripts/translation-workflow';
import { TRANSLATION_NAMESPACES } from '../../scripts/utils/collect-content';
import { providerCodeForLocale } from '../../scripts/utils/locale-provider-map';
import { protectContent } from '../../scripts/utils/protected-content';
import { readJson, writeJson } from '../../scripts/utils/json';
import { TranslationCache } from '../../scripts/utils/translation-cache';
import { validateTranslationShape } from '../../scripts/utils/translation-shape';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe('machine translation workflow', () => {
  it('maps every representative app locale to its provider code', () => {
    expect(providerCodeForLocale('en-US')).toBe('en');
    expect(providerCodeForLocale('pt-BR')).toBe('pt');
    expect(providerCodeForLocale('zh-TW')).toBe('zh');
    expect(providerCodeForLocale('he-IL')).toBe('he');
  });

  it('fails unsupported locales unless fallback is explicit', async () => {
    const root = await fixtureRoot();
    await expect(
      translateLocale({
        locale: 'nb-NO',
        provider: mockProvider(),
        supportedLanguages: new Set(['en', 'es']),
        cache: new TranslationCache(join(root, 'cache.json')),
        translationsRoot: join(root, 'translations'),
      }),
    ).rejects.toThrow(/not supported.*allow-fallback/i);
  });

  it('writes explicit fallback metadata when fallback is allowed', async () => {
    const root = await fixtureRoot();
    const translationsRoot = join(root, 'translations');
    await writeEnglishFixture(translationsRoot);
    const result = await translateLocale({
      locale: 'nb-NO',
      provider: mockProvider(),
      supportedLanguages: new Set(['en', 'es']),
      cache: new TranslationCache(join(root, 'cache.json')),
      translationsRoot,
      allowFallback: true,
      now: () => new Date('2026-07-07T00:00:00.000Z'),
      validate: async () => ({ errors: [] }),
      generate: async (locale) =>
        generateLocale(locale, {
          translationsRoot,
          generatedLocalesRoot: join(root, 'generated'),
        }),
    });
    const metadata = (await readJson(
      join(translationsRoot, 'nb-NO/translation.meta.json'),
    )) as { fallback: boolean; status: string; reason: string };
    expect(result.fallback).toBe(true);
    expect(metadata.fallback).toBe(true);
    expect(metadata.status).toBe('fallback');
    expect(metadata.reason).toContain('nb');
  });

  it('protects placeholders, URLs, and product terms', () => {
    const source =
      'Aerealith AI: visit https://aerealith.ai for {{name}} using <Link>GitHub</Link>.';
    const protectedText = protectContent(source);
    expect(protectedText.text).not.toContain('Aerealith AI');
    expect(protectedText.restore(protectedText.text)).toBe(source);
  });

  it('returns cached translations for unchanged source text', async () => {
    const root = await fixtureRoot();
    const path = join(root, 'cache.json');
    const cache = new TranslationCache(path);
    cache.set('libretranslate', 'en', 'es', 'Hello', 'Hola');
    await cache.save();
    const reloaded = new TranslationCache(path);
    await reloaded.load();
    expect(reloaded.get('libretranslate', 'en', 'es', 'Hello')).toBe('Hola');
    expect(reloaded.get('libretranslate', 'en', 'fr', 'Hello')).toBeUndefined();
  });

  it('preserves shape, validates output, and generates locale TypeScript', async () => {
    const root = await fixtureRoot();
    const translationsRoot = join(root, 'translations');
    const generatedRoot = join(root, 'generated');
    await writeEnglishFixture(translationsRoot);
    const provider = mockProvider();
    const validate = async (locale: string) => {
      const errors: string[] = [];
      for (const namespace of TRANSLATION_NAMESPACES) {
        const source = await readJson(
          join(translationsRoot, 'en', `${namespace}.json`),
        );
        const translated = await readJson(
          join(translationsRoot, locale, `${namespace}.json`),
        );
        errors.push(
          ...validateTranslationShape(source, translated, namespace).errors,
        );
      }
      return { errors };
    };
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
    });
    expect(result.translatedStrings).toBeGreaterThan(0);
    expect(await validate('es-ES')).toEqual({ errors: [] });
    expect(
      await readFile(join(generatedRoot, 'es-ES/index.ts'), 'utf8'),
    ).toContain('export const esESContent =');
  });
});

function mockProvider(): TranslationProvider {
  return {
    name: 'libretranslate',
    getSupportedLanguages: vi.fn(async () => new Set(['en', 'es'])),
    translateText: vi.fn(async ({ text }) => `Traducido: ${text}`),
  };
}

async function fixtureRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'aerealith-translation-'));
  temporaryDirectories.push(root);
  return root;
}

async function writeEnglishFixture(translationsRoot: string): Promise<void> {
  for (const namespace of TRANSLATION_NAMESPACES) {
    await writeJson(join(translationsRoot, 'en', `${namespace}.json`), {
      id: `${namespace}-content`,
      title: `English ${namespace} title`,
      body: 'Aerealith AI helps {{name}}. Visit https://aerealith.ai.',
    });
  }
}
