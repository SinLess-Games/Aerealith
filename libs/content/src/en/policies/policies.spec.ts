import { describe, expect, it } from 'vitest'

import compatibilityPolicy from './payment-proccessor-compliance'
import {
  acceptableUsePolicy,
  aiTransparencyPolicy,
  billingRefundCancellationPolicy,
  cookieTrackingPolicy,
  copyrightTakedownPolicy,
  dataPolicy,
  developerPolicy,
  englishPolicies,
  incidentNotificationPolicy,
  paymentProcessorCompliancePolicy,
  policiesByPath,
  policiesBySlug,
  privacyPolicy,
  responsibleAiPolicy,
  securityPolicy,
  subprocessorVendorListPolicy,
  supportPolicy,
  termsOfUsePolicy,
  underagePolicy,
  userGeneratedContentPolicy,
} from '.'

const individualPolicies = [
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
]

describe('policy content', () => {
  it('exports every individual policy through the policy registry', () => {
    expect(englishPolicies).toHaveLength(individualPolicies.length)
    expect(new Set(englishPolicies)).toEqual(new Set(individualPolicies))
  })

  it('provides complete metadata, sections, and indexes', () => {
    for (const policy of englishPolicies) {
      expect(policy.meta.title).toBeTruthy()
      expect(policy.meta.description).toBeTruthy()
      expect(policy.sections.length).toBeGreaterThan(0)
      expect(policiesBySlug[policy.slug]).toBe(policy)
      expect(policiesByPath[policy.path]).toBe(policy)
    }
  })

  it('keeps the misspelled payment processor path compatible', () => {
    expect(compatibilityPolicy).toBe(paymentProcessorCompliancePolicy)
  })
})
