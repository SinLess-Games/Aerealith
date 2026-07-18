import type { HomeCommunityFundingSectionContent } from '../../types'

export const communityFundingSection = {
  id: 'crowdfunding',
  eyebrow: 'Community Funding',
  title: 'Help Build Aerealith AI',
  description:
    'Support the infrastructure, engineering, security, design, integrations, documentation, and production systems needed to bring Aerealith AI to life.',
  body: 'Aerealith AI is being built as a long-term platform, not a quick chatbot wrapper. Crowdfunding, aligned investor support, and early community backing help fund the infrastructure, engineering, security, design, integrations, documentation, and production systems needed to turn Aerealith AI into a reliable command center for users, creators, developers, communities, teams, and organizations.',
} as const satisfies HomeCommunityFundingSectionContent

export const COMMUNITY_FUNDING_SECTION = communityFundingSection
