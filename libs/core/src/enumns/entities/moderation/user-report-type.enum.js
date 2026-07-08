'use strict';
// libs/core/src/enumns/entities/moderation/user-report-type.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserReportTypeValues =
  exports.DefaultUserReportType =
  exports.UserReportType =
    void 0;
exports.isUserReportType = isUserReportType;
/**
 * User-submitted report types for moderation.
 */
exports.UserReportType = {
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
};
exports.DefaultUserReportType = exports.UserReportType.Other;
exports.UserReportTypeValues = Object.values(exports.UserReportType);
function isUserReportType(value) {
  return (
    typeof value === 'string' && exports.UserReportTypeValues.includes(value)
  );
}
//# sourceMappingURL=user-report-type.enum.js.map
