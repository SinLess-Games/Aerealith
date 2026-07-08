export interface TranslationProvider {
  readonly name: string;
  getSupportedLanguages(): Promise<ReadonlySet<string>>;
  translateText(input: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    context?: string;
  }): Promise<string>;
}
