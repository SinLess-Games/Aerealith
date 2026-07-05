// libs/core/src/enumns/entities/language/language-proficiency.enum.ts

/**
 * User-selectable language proficiency levels.
 */
export const LanguageProficiency = {
  Unspecified: 'unspecified',
  Beginner: 'beginner',
  Intermediate: 'intermediate',
  Advanced: 'advanced',
  Fluent: 'fluent',
  Native: 'native',
} as const

export type LanguageProficiency =
  (typeof LanguageProficiency)[keyof typeof LanguageProficiency]

export const DefaultLanguageProficiency = LanguageProficiency.Unspecified

export const LanguageProficiencyValues = Object.values(LanguageProficiency)

export const LanguageProficiencyRank = {
  [LanguageProficiency.Unspecified]: 0,
  [LanguageProficiency.Beginner]: 1,
  [LanguageProficiency.Intermediate]: 2,
  [LanguageProficiency.Advanced]: 3,
  [LanguageProficiency.Fluent]: 4,
  [LanguageProficiency.Native]: 5,
} as const satisfies Record<LanguageProficiency, number>

export function isLanguageProficiency(
  value: unknown,
): value is LanguageProficiency {
  return (
    typeof value === 'string' &&
    LanguageProficiencyValues.includes(value as LanguageProficiency)
  )
}
