// libs/core/src/enumns/entities/moderation/user-report-type.enum.ts

/**
 * User-submitted report types for moderation.
 */
export const UserReportType = {
  Spam: 'spam',
  Harassment: 'harassment',
  HateSpeech: 'hate_speech',
  ThreatsOrViolence: 'threats_or_violence',
  SexualContent: 'sexual_content',
  SelfHarm: 'self_harm',
  Impersonation: 'impersonation',
  ScamOrFraud: 'scam_or_fraud',
  IllegalContent: 'illegal_content',
  PrivacyViolation: 'privacy_violation',
  IntellectualProperty: 'intellectual_property',
  ChildSafety: 'child_safety',
  Other: 'other',
} as const

export type UserReportType =
  (typeof UserReportType)[keyof typeof UserReportType]

export const DefaultUserReportType = UserReportType.Other

export const UserReportTypeValues = Object.values(UserReportType)

export function isUserReportType(value: unknown): value is UserReportType {
  return (
    typeof value === 'string' &&
    UserReportTypeValues.includes(value as UserReportType)
  )
}
