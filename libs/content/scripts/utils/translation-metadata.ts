export interface TranslationMetadata {
  locale: string;
  sourceLocale: 'en-US';
  provider: string;
  providerUrl?: string;
  status: 'machine_translated' | 'fallback';
  sourceHash: string;
  translatedAt: string;
  fallback: boolean;
  reason?: string;
}
