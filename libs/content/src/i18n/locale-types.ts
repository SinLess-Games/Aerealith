export const localeLaunchStages = [
  'launch',
  'early-global',
  'strong-expansion',
  'community-global',
  'eu-nordic',
  'rtl-later',
] as const;

export type LocaleLaunchStage = (typeof localeLaunchStages)[number];
export type LocaleDirection = 'ltr' | 'rtl';

export const supportedLocales = {
  'en-US': {
    name: 'English (United States)',
    stage: 'launch',
    direction: 'ltr',
  },
  'es-ES': { name: 'Español (España)', stage: 'launch', direction: 'ltr' },
  'pt-BR': {
    name: 'Português (Brasil)',
    stage: 'early-global',
    direction: 'ltr',
  },
  'fr-FR': {
    name: 'Français (France)',
    stage: 'early-global',
    direction: 'ltr',
  },
  'de-DE': {
    name: 'Deutsch (Deutschland)',
    stage: 'early-global',
    direction: 'ltr',
  },
  'ja-JP': { name: '日本語 (日本)', stage: 'early-global', direction: 'ltr' },
  'it-IT': {
    name: 'Italiano (Italia)',
    stage: 'strong-expansion',
    direction: 'ltr',
  },
  'nl-NL': {
    name: 'Nederlands (Nederland)',
    stage: 'strong-expansion',
    direction: 'ltr',
  },
  'pl-PL': {
    name: 'Polski (Polska)',
    stage: 'strong-expansion',
    direction: 'ltr',
  },
  'tr-TR': {
    name: 'Türkçe (Türkiye)',
    stage: 'strong-expansion',
    direction: 'ltr',
  },
  'ko-KR': {
    name: '한국어 (대한민국)',
    stage: 'strong-expansion',
    direction: 'ltr',
  },
  'zh-CN': {
    name: '简体中文（中国）',
    stage: 'strong-expansion',
    direction: 'ltr',
  },
  'zh-TW': {
    name: '繁體中文（台灣）',
    stage: 'strong-expansion',
    direction: 'ltr',
  },
  'id-ID': {
    name: 'Bahasa Indonesia',
    stage: 'community-global',
    direction: 'ltr',
  },
  'vi-VN': {
    name: 'Tiếng Việt (Việt Nam)',
    stage: 'community-global',
    direction: 'ltr',
  },
  'ru-RU': {
    name: 'Русский (Россия)',
    stage: 'community-global',
    direction: 'ltr',
  },
  'uk-UA': {
    name: 'Українська (Україна)',
    stage: 'community-global',
    direction: 'ltr',
  },
  'sv-SE': { name: 'Svenska (Sverige)', stage: 'eu-nordic', direction: 'ltr' },
  'da-DK': { name: 'Dansk (Danmark)', stage: 'eu-nordic', direction: 'ltr' },
  'fi-FI': { name: 'Suomi (Suomi)', stage: 'eu-nordic', direction: 'ltr' },
  'nb-NO': {
    name: 'Norsk bokmål (Norge)',
    stage: 'eu-nordic',
    direction: 'ltr',
  },
  'cs-CZ': { name: 'Čeština (Česko)', stage: 'eu-nordic', direction: 'ltr' },
  'hu-HU': {
    name: 'Magyar (Magyarország)',
    stage: 'eu-nordic',
    direction: 'ltr',
  },
  'ro-RO': { name: 'Română (România)', stage: 'eu-nordic', direction: 'ltr' },
  ar: { name: 'العربية', stage: 'rtl-later', direction: 'rtl' },
  'he-IL': { name: 'עברית (ישראל)', stage: 'rtl-later', direction: 'rtl' },
} as const satisfies Record<
  string,
  {
    readonly name: string;
    readonly stage: LocaleLaunchStage;
    readonly direction: LocaleDirection;
  }
>;

export type SupportedLocale = keyof typeof supportedLocales;
export type SourceLocale = 'en-US';
export const sourceLocale: SourceLocale = 'en-US';

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locale in supportedLocales;
}

export function localesForStage(
  stage: LocaleLaunchStage,
): readonly SupportedLocale[] {
  return (Object.keys(supportedLocales) as SupportedLocale[]).filter(
    (locale) => supportedLocales[locale].stage === stage,
  );
}
