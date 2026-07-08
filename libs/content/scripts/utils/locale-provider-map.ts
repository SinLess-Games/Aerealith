import type { SupportedLocale } from '../../src/i18n/locale-types';

export const libreTranslateLocaleCodes = {
  'en-US': 'en',
  'es-ES': 'es',
  'pt-BR': 'pt',
  'fr-FR': 'fr',
  'de-DE': 'de',
  'ja-JP': 'ja',
  'it-IT': 'it',
  'nl-NL': 'nl',
  'pl-PL': 'pl',
  'tr-TR': 'tr',
  'ko-KR': 'ko',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  'id-ID': 'id',
  'vi-VN': 'vi',
  'ru-RU': 'ru',
  'uk-UA': 'uk',
  'sv-SE': 'sv',
  'da-DK': 'da',
  'fi-FI': 'fi',
  'nb-NO': 'nb',
  'cs-CZ': 'cs',
  'hu-HU': 'hu',
  'ro-RO': 'ro',
  ar: 'ar',
  'he-IL': 'he',
} as const satisfies Record<SupportedLocale, string>;

export function providerCodeForLocale(locale: SupportedLocale): string {
  return libreTranslateLocaleCodes[locale];
}
