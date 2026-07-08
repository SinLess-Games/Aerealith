'use strict';
// libs/core/src/enumns/entities/moderation/profile-review.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.ProfileReviewValues =
  exports.DefaultProfileReview =
  exports.ProfileReview =
    void 0;
exports.isProfileReview = isProfileReview;
/**
 * Profile moderation review outcomes and reasons.
 */
exports.ProfileReview = {
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
};
exports.DefaultProfileReview = exports.ProfileReview.Pending;
exports.ProfileReviewValues = Object.values(exports.ProfileReview);
function isProfileReview(value) {
  return (
    typeof value === 'string' && exports.ProfileReviewValues.includes(value)
  );
}
//# sourceMappingURL=profile-review.enum.js.map
