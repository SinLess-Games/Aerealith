// libs/core/src/enumns/entities/user/sex-attitude.enum.ts

/**
 * User-selectable sex attitude values.
 *
 * This describes comfort/preference around sexual content or activity,
 * not sexual orientation.
 */
export const SexAttitude = {
  Unspecified: 'unspecified',
  PreferNotToSay: 'prefer_not_to_say',
  NotListed: 'not_listed',
  SelfDescribe: 'self_describe',

  Favorable: 'favorable',
  Positive: 'positive',
  Neutral: 'neutral',
  Indifferent: 'indifferent',
  Averse: 'averse',
  Repulsed: 'repulsed',
} as const

export type SexAttitude = (typeof SexAttitude)[keyof typeof SexAttitude]

export const DefaultSexAttitude = SexAttitude.Unspecified

export const SexAttitudeValues = Object.values(SexAttitude)

export function isSexAttitude(value: unknown): value is SexAttitude {
  return (
    typeof value === 'string' &&
    SexAttitudeValues.includes(value as SexAttitude)
  )
}
