/**
 * User-submitted report types for moderation.
 */
export declare const UserReportType: {
  readonly Spam: 'spam';
  readonly Harassment: 'harassment';
  readonly HateSpeech: 'hate_speech';
  readonly ThreatsOrViolence: 'threats_or_violence';
  readonly SexualContent: 'sexual_content';
  readonly SelfHarm: 'self_harm';
  readonly Impersonation: 'impersonation';
  readonly ScamOrFraud: 'scam_or_fraud';
  readonly IllegalContent: 'illegal_content';
  readonly PrivacyViolation: 'privacy_violation';
  readonly IntellectualProperty: 'intellectual_property';
  readonly ChildSafety: 'child_safety';
  readonly Other: 'other';
};
export type UserReportType =
  (typeof UserReportType)[keyof typeof UserReportType];
export declare const DefaultUserReportType: 'other';
export declare const UserReportTypeValues: (
  | 'spam'
  | 'impersonation'
  | 'harassment'
  | 'hate_speech'
  | 'threats_or_violence'
  | 'sexual_content'
  | 'child_safety'
  | 'illegal_content'
  | 'privacy_violation'
  | 'other'
  | 'self_harm'
  | 'scam_or_fraud'
  | 'intellectual_property'
)[];
export declare function isUserReportType(
  value: unknown,
): value is UserReportType;
