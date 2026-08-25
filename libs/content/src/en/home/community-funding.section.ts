import type { HomeCommunityFundingSectionContent } from '../../types'

export const communityFundingSection = {
  id: 'crowdfunding',
  eyebrow: 'Community Funding',
  title: 'Help Build Aerealith',
  description:
    'Support the infrastructure, engineering, security, design, integrations, documentation, and production systems needed to build Aerealith.',
  body: 'Aerealith is a long-term platform in active development, not a quick chatbot wrapper. It is developed by SinLess Games LLC and operated under SinLess Industries. Community and investor support helps fund the engineering, security, design, integrations, documentation, and production foundations needed to deliver it responsibly.',
} as const satisfies HomeCommunityFundingSectionContent

export const COMMUNITY_FUNDING_SECTION = communityFundingSection
