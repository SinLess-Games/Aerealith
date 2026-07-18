import acceptableUsePolicyData from './acceptable-use.json'
import aiTransparencyPolicyData from './ai-transparency.json'
import billingRefundCancellationPolicyData from './billing-refund-cancellation.json'
import cookieTrackingPolicyData from './cookie-tracking.json'
import copyrightTakedownPolicyData from './copyright-takedown.json'
import dataPolicyData from './data.json'
import developerPolicyData from './developer.json'
import incidentNotificationPolicyData from './incident-notification.json'
import paymentProcessorCompliancePolicyData from './payment-processor-compliance.json'
import privacyPolicyData from './privacy.json'
import responsibleAiPolicyData from './responsible-ai.json'
import securityPolicyData from './security.json'
import subprocessorVendorListPolicyData from './subprocessor-vendor-list.json'
import supportPolicyData from './support.json'
import termsOfUsePolicyData from './terms-of-use.json'
import underagePolicyData from './underage.json'
import userGeneratedContentPolicyData from './user-generated-content.json'

import type { PolicyDocument } from '../../types'
import { definePolicyDocuments } from './define-policy-documents'

export const {
  acceptableUsePolicy,
  aiTransparencyPolicy,
  billingRefundCancellationPolicy,
  cookieTrackingPolicy,
  copyrightTakedownPolicy,
  dataPolicy,
  developerPolicy,
  incidentNotificationPolicy,
  paymentProcessorCompliancePolicy,
  privacyPolicy,
  responsibleAiPolicy,
  securityPolicy,
  subprocessorVendorListPolicy,
  supportPolicy,
  termsOfUsePolicy,
  underagePolicy,
  userGeneratedContentPolicy,
} = definePolicyDocuments({
  acceptableUsePolicy: acceptableUsePolicyData,
  aiTransparencyPolicy: aiTransparencyPolicyData,
  billingRefundCancellationPolicy: billingRefundCancellationPolicyData,
  cookieTrackingPolicy: cookieTrackingPolicyData,
  copyrightTakedownPolicy: copyrightTakedownPolicyData,
  dataPolicy: dataPolicyData,
  developerPolicy: developerPolicyData,
  incidentNotificationPolicy: incidentNotificationPolicyData,
  paymentProcessorCompliancePolicy: paymentProcessorCompliancePolicyData,
  privacyPolicy: privacyPolicyData,
  responsibleAiPolicy: responsibleAiPolicyData,
  securityPolicy: securityPolicyData,
  subprocessorVendorListPolicy: subprocessorVendorListPolicyData,
  supportPolicy: supportPolicyData,
  termsOfUsePolicy: termsOfUsePolicyData,
  underagePolicy: underagePolicyData,
  userGeneratedContentPolicy: userGeneratedContentPolicyData,
})

export const englishPolicies = [
  termsOfUsePolicy,
  privacyPolicy,
  dataPolicy,
  securityPolicy,
  acceptableUsePolicy,
  aiTransparencyPolicy,
  responsibleAiPolicy,
  cookieTrackingPolicy,
  billingRefundCancellationPolicy,
  paymentProcessorCompliancePolicy,
  copyrightTakedownPolicy,
  incidentNotificationPolicy,
  subprocessorVendorListPolicy,
  supportPolicy,
  underagePolicy,
  userGeneratedContentPolicy,
  developerPolicy,
] as const satisfies readonly PolicyDocument[]

export const policiesBySlug: Readonly<Record<string, PolicyDocument>> =
  Object.fromEntries(englishPolicies.map((policy) => [policy.slug, policy]))

export const policiesByPath: Readonly<Record<string, PolicyDocument>> =
  Object.fromEntries(englishPolicies.map((policy) => [policy.path, policy]))
