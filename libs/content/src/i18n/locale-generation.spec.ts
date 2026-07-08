import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { generateLocale } from '../../scripts/generate-locale-ts';
import {
  GENERATED_LOCALES_ROOT,
  TRANSLATION_NAMESPACES,
} from '../../scripts/utils/collect-content';
import { localeExportName } from '../../scripts/utils/format-generated-ts';
import { writeJson } from '../../scripts/utils/json';
import { sourceLocale, supportedLocales } from './locale-types';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('locale generation', () => {
  it('keeps a permanent generated module for every configured locale', async () => {
    const translatedLocales = Object.keys(supportedLocales).filter(
      (locale) => locale !== sourceLocale,
    );

    for (const locale of translatedLocales) {
      const module = await readFile(
        join(GENERATED_LOCALES_ROOT, locale, 'index.ts'),
        'utf8',
      );
      expect(module).toContain(`export const ${localeExportName(locale)}`);
      expect(module).toContain('TranslationContent');
    }
  });

  it('generates a typed module for every configured translated locale', async () => {
    const root = await mkdtemp(join(tmpdir(), 'aerealith-content-locales-'));
    temporaryDirectories.push(root);
    const translationsRoot = join(root, 'translations');
    const generatedLocalesRoot = join(root, 'generated');
    const translatedLocales = Object.keys(supportedLocales).filter(
      (locale) => locale !== sourceLocale,
    );

    for (const locale of translatedLocales) {
      for (const namespace of TRANSLATION_NAMESPACES) {
        await writeJson(join(translationsRoot, locale, `${namespace}.json`), {
          locale,
          namespace,
        });
      }

      const outputPath = await generateLocale(locale, {
        translationsRoot,
        generatedLocalesRoot,
      });
      const generatedModule = await readFile(outputPath, 'utf8');

      expect(outputPath).toBe(join(generatedLocalesRoot, locale, 'index.ts'));
      expect(generatedModule).toContain(
        `export const ${localeExportName(locale)} =`,
      );
      expect(generatedModule).toContain('satisfies TranslationContent');
      for (const namespace of TRANSLATION_NAMESPACES) {
        expect(generatedModule).toContain(`"${namespace}":`);
      }
      expect(generatedModule.endsWith('\n')).toBe(true);
    }

    expect(translatedLocales).toHaveLength(25);
    expect(localeExportName('pt-BR')).toBe('ptBRContent');
    expect(localeExportName('zh-TW')).toBe('zhTWContent');
    expect(localeExportName('he-IL')).toBe('heILContent');
  });

  it('produces deterministic output for the same locale input', async () => {
    const root = await mkdtemp(join(tmpdir(), 'aerealith-content-repeat-'));
    temporaryDirectories.push(root);
    const translationsRoot = join(root, 'translations');
    const generatedLocalesRoot = join(root, 'generated');

    for (const namespace of TRANSLATION_NAMESPACES) {
      await writeJson(join(translationsRoot, 'es-ES', `${namespace}.json`), {
        namespace,
      });
    }

    const path = await generateLocale('es-ES', {
      translationsRoot,
      generatedLocalesRoot,
    });
    const first = await readFile(path, 'utf8');
    await generateLocale('es-ES', { translationsRoot, generatedLocalesRoot });
    const second = await readFile(path, 'utf8');

    expect(second).toBe(first);
  });
});
