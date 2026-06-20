// libs/core/src/enumns/entities/moderation/profile-review.enum.ts

/**
 * Profile moderation review outcomes and reasons.
 */
export const ProfileReview = {
  Pending: 'pending',
  Approved: 'approved',
  UnderReview: 'under_review',

  Restricted: 'restricted',
  Suspended: 'suspended',
  Banned: 'banned',

  Spam: 'spam',
  Scam: 'scam',
  Impersonation: 'impersonation',
  Harassment: 'harassment',
  HateSpeech: 'hate_speech',
  ThreatsOrViolence: 'threats_or_violence',
  SexualContent: 'sexual_content',
  ChildSafety: 'child_safety',
  IllegalContent: 'illegal_content',
  PrivacyViolation: 'privacy_violation',

  Other: 'other',
} as const;

export type ProfileReview =
  (typeof ProfileReview)[keyof typeof ProfileReview];

export const DefaultProfileReview = ProfileReview.Pending;

export const ProfileReviewValues = Object.values(ProfileReview);

export function isProfileReview(value: unknown): value is ProfileReview {
  return (
    typeof value === 'string' &&
    ProfileReviewValues.includes(value as ProfileReview)
  );
}