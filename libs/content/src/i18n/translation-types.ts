import type { EnglishContent } from '../en';

export type NonTranslatableStringKey =
  | 'component'
  | 'href'
  | 'id'
  | 'image'
  | 'imageUrl'
  | 'path'
  | 'poster'
  | 'slug'
  | 'src'
  | 'type'
  | 'value';

/** Recursively widens prose while preserving structural string literals. */
export type TranslationTree<T, TKey = never> = T extends string
  ? [TKey] extends [never]
    ? string
    : TKey extends NonTranslatableStringKey
      ? T
      : string
  : T extends number | boolean | null | undefined
    ? T
    : T extends readonly unknown[]
      ? { readonly [TIndex in keyof T]: TranslationTree<T[TIndex]> }
      : T extends object
        ? {
            readonly [TChildKey in keyof T]: TranslationTree<
              T[TChildKey],
              TChildKey
            >;
          }
        : T;

export type TranslationContent = TranslationTree<EnglishContent>;
