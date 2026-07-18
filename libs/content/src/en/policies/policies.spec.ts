import { describe, expect, it } from 'vitest'

import compatibilityPolicy from './payment-proccessor-compliance'
import { definePolicyDocuments } from './define-policy-documents'
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

  it('preserves policy text and uses the canonical support address', () => {
    const serializedPolicies = JSON.stringify(englishPolicies)

    expect(serializedPolicies).not.toContain('\uFFFD')
    expect(serializedPolicies).not.toContain('support@sinlessgames.com')
    expect(serializedPolicies).toContain('support@aerealith.com')
  })

  it('rejects invalid nested policy data', () => {
    const validSection = {
      id: 'scope',
      title: 'Scope',
      body: ['This policy applies to the test.'],
      contacts: [
        {
          label: 'Support',
          email: 'support@aerealith.com',
          href: 'mailto:support@aerealith.com',
        },
      ],
    }
    const validPolicy = {
      slug: 'test-policy',
      path: '/Policies/test-policy',
      meta: {
        title: 'Test Policy',
        description: 'Validates policy documents.',
        effectiveDate: '2026-07-18',
        lastUpdated: '2026-07-18',
        owner: 'SinLess Games LLC',
        status: 'draft',
      },
      sections: [validSection],
    }

    expect(definePolicyDocuments({ validPolicy }).validPolicy).toBe(validPolicy)
    expect(() =>
      definePolicyDocuments({
        invalidPolicy: {
          ...validPolicy,
          meta: { ...validPolicy.meta, status: 'pending' },
        },
      }),
    ).toThrow('Invalid policy document: invalidPolicy')
    expect(() =>
      definePolicyDocuments({
        invalidPolicy: {
          ...validPolicy,
          sections: [
            {
              ...validSection,
              contacts: [
                {
                  ...validSection.contacts[0],
                  href: 'mailto:wrong@example.com',
                },
              ],
            },
          ],
        },
      }),
    ).toThrow('Invalid policy document: invalidPolicy')
  })
  it('keeps the misspelled payment processor path compatible', () => {
    expect(compatibilityPolicy).toBe(paymentProcessorCompliancePolicy)
  })
})
