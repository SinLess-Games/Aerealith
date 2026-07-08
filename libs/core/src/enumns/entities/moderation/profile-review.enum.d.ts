/**
 * Profile moderation review outcomes and reasons.
 */
export declare const ProfileReview: {
  readonly Pending: 'pending';
  readonly Approved: 'approved';
  readonly UnderReview: 'under_review';
  readonly Restricted: 'restricted';
  readonly Suspended: 'suspended';
  readonly Banned: 'banned';
  readonly Spam: 'spam';
  readonly Scam: 'scam';
  readonly Impersonation: 'impersonation';
  readonly Harassment: 'harassment';
  readonly HateSpeech: 'hate_speech';
  readonly ThreatsOrViolence: 'threats_or_violence';
  readonly SexualContent: 'sexual_content';
  readonly ChildSafety: 'child_safety';
  readonly IllegalContent: 'illegal_content';
  readonly PrivacyViolation: 'privacy_violation';
  readonly Other: 'other';
};
export type ProfileReview = (typeof ProfileReview)[keyof typeof ProfileReview];
export declare const DefaultProfileReview: 'pending';
export declare const ProfileReviewValues: (
  | 'approved'
  | 'suspended'
  | 'restricted'
  | 'pending'
  | 'under_review'
  | 'banned'
  | 'spam'
  | 'scam'
  | 'impersonation'
  | 'harassment'
  | 'hate_speech'
  | 'threats_or_violence'
  | 'sexual_content'
  | 'child_safety'
  | 'illegal_content'
  | 'privacy_violation'
  | 'other'
)[];
export declare function isProfileReview(value: unknown): value is ProfileReview;
