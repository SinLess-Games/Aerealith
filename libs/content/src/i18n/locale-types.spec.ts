import { describe, expect, it } from 'vitest';

import {
  getContentForLocale,
  resolveSupportedLocale,
} from './translation-registry';
import {
  isSupportedLocale,
  localesForStage,
  supportedLocales,
} from './locale-types';
import { englishContent } from '../en';

describe('supported locales', () => {
  it('registers all rollout locales', () => {
    expect(Object.keys(supportedLocales)).toHaveLength(26);
    expect(localesForStage('launch')).toEqual(['en-US', 'es-ES']);
    expect(localesForStage('rtl-later')).toEqual(['ar', 'he-IL']);
  });

  it('marks only Arabic and Hebrew as RTL', () => {
    const rtlLocales = Object.entries(supportedLocales)
      .filter(([, locale]) => locale.direction === 'rtl')
      .map(([locale]) => locale);
    expect(rtlLocales).toEqual(['ar', 'he-IL']);
  });

  it('validates and resolves locale codes', () => {
    expect(isSupportedLocale('pt-BR')).toBe(true);
    expect(isSupportedLocale('en-GB')).toBe(false);
    expect(resolveSupportedLocale('en-GB')).toBe('en-US');
    expect(resolveSupportedLocale('es-MX')).toBe('es-ES');
    expect(resolveSupportedLocale('unknown')).toBe('en-US');
  });

  it('falls back to English until a translated locale is generated', () => {
    expect(getContentForLocale('es-ES')).toBe(englishContent);
  });
});
