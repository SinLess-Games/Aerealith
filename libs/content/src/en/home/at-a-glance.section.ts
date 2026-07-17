import type {
  AtAGlanceSectionContent,
  HomeCarouselSectionContent,
} from '../../types'

/**
 * Home page overview section content.
 *
 * @public
 * @constant
 * @readonly
 * @decorator section
 */
export const atAGlanceSection = {
  eyebrow: 'At a glance',
  title: 'The full home story in one carousel',
  description:
    'Explore the core home sections in sequence: the hero, the platform overview, the product preview, crowdfunding, and pricing.',
  carouselSections: [
    {
      component: 'marketing-section',
      id: 'hero',
      eyebrow: 'Aerealith AI',
      title: 'Your digital life, intelligently connected.',
      description:
        'Unify memory, automations, analytics, integrations, dashboards, and assistant workflows in one secure AI companion.',
    },
    {
      component: 'marketing-section',
      id: 'infographics',
      eyebrow: 'Platform Overview',
      title: 'See How Aerealith AI Fits Together',
      description:
        'Explore visual breakdowns of the platform, integrations, memory, automation, analytics, and user-control model.',
    },
    {
      component: 'marketing-section',
      id: 'product-preview',
      eyebrow: 'Product Preview',
      title: 'A Command Center for Your Digital World',
      description:
        'Preview the direction of Aerealith AI across dashboards, assistant workflows, integrations, analytics, and connected systems.',
    },
    {
      component: 'crowdfunding-section',
      id: 'crowdfunding',
      content: {
        eyebrow: 'Community Funding',
        title: 'Help Build Aerealith AI',
        description:
          'Support the infrastructure, engineering, security, design, integrations, documentation, and production systems needed to bring Aerealith AI to life.',
        body: 'Aerealith AI is being built as a long-term platform, not a quick chatbot wrapper. Crowdfunding, aligned investor support, and early community backing help fund the infrastructure, engineering, security, design, integrations, documentation, and production systems needed to turn Aerealith AI into a reliable command center for users, creators, developers, communities, teams, and organizations.',
      },
    },
    {
      component: 'pricing-preview-section',
      id: 'pricing-preview',
      content: {
        eyebrow: 'Plans & Pricing',
        title: 'Pricing Preview',
        description:
          'Start with the core features you need today, then scale into more advanced capabilities as your workflow grows. Aerealith AI is designed to meet users where they are, whether they are exploring the platform for the first time, organizing personal tasks, managing a community, building developer workflows, or preparing for team and enterprise use. As your needs expand, you can unlock deeper memory, stronger automation, more integrations, richer analytics, higher usage limits, and more advanced support without having to switch platforms or rebuild your workflow from scratch.',
        body: 'Aerealith AI is planned with simple, transparent tiers so users can start free, explore the platform, and upgrade only when they need more capability. The goal is to make pricing easy to understand while still giving room for different types of users: individuals who want a smarter assistant, creators and communities that need automation and engagement tools, developers who want integrations and extensibility, teams that need collaboration and analytics, and organizations that require stronger governance, self-hosting, or enterprise deployment options. As the MVP ships and real usage data becomes available, pricing will continue to be refined around actual infrastructure costs, AI model usage, support needs, feature limits, and customer feedback. Each tier is intended to grow with the user, offering a clear path from early experimentation to advanced workflows, professional use, business operations, and long-term enterprise readiness.',
      },
    },
  ] as const satisfies readonly HomeCarouselSectionContent[],
} as const satisfies AtAGlanceSectionContent

/**
 * Backwards-compatible alias for the overview section list.
 *
 * @public
 * @constant
 * @readonly
 * @decorator alias
 */
export const atAGlanceCarouselSections = atAGlanceSection.carouselSections
