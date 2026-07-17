import { atAGlanceSection } from './at-a-glance.section'
import { communityFundingSection } from './community-funding.section'
import { faqCards, faqSection } from './faq.section'
import { HERO_DATA, INVESTOR_VIDEO } from './hero.section'
import {
  aerealithDifferentiators,
  whyAerealithAiSection,
} from './why-aerealith-ai.section'

export const homeLandingPageContent = {
  hero: {
    eyebrow: 'Aerealith AI',
    title: 'Your Digital Life,',
    highlightedTitle: 'Intelligently Connected.',
    description:
      'Aerealith AI is a personal digital assistant that unifies your apps, data, and workflows in one intelligent layer. Smarter automation, richer insights, and a life organized the way it is built for you.',
    primaryAction: { label: 'Get started', href: '/sign-up' },
    secondaryAction: { label: 'See updates', href: '/contact' },
    image: {
      src: '/images/brand/mark-no-background.png',
      alt: HERO_DATA.imageAlt,
    },
  },
  waitlist: {
    eyebrow: 'Join the waitlist',
    title: 'Get early access, launch updates, and product news.',
    emailLabel: 'Email address',
    emailPlaceholder: 'Enter your email',
    roleLabel: 'Your role',
    rolePlaceholder: 'Select your role',
    roles: ['Individual', 'Creator', 'Developer', 'Community', 'Team'],
    submitLabel: 'Join waitlist',
    privacyNote: 'We respect your privacy. No spam, ever.',
  },
  promises: [
    { title: 'First Access', description: 'Be first in line.' },
    { title: 'Shape the Future', description: 'Your input, your AI.' },
    { title: 'No Obligation', description: 'Unsubscribe anytime.' },
  ],
  story: {
    eyebrow: atAGlanceSection.eyebrow,
    title: atAGlanceSection.title,
    description:
      'Explore the Aerealith experience in chapters. See how it works, what it connects, and how it adapts to you.',
    items: atAGlanceSection.carouselSections,
  },
  differentiators: {
    eyebrow: whyAerealithAiSection.eyebrow,
    title: whyAerealithAiSection.title,
    description: whyAerealithAiSection.description,
    items: aerealithDifferentiators.slice(0, 5),
  },
  funding: {
    eyebrow: communityFundingSection.eyebrow,
    title: communityFundingSection.title,
    description: communityFundingSection.description,
    benefits: [
      'Long-term vision, built in the open.',
      'Community-driven and privacy-first.',
      'Early access to updates and new features.',
    ],
    primaryAction: { label: 'Support the build', href: '/contact' },
    secondaryAction: { label: 'Learn more', href: '/about' },
    video: {
      ...INVESTOR_VIDEO,
      label: 'Immersive Overview',
      duration: '03:12',
      image: '/images/brand/mark-no-background.png',
    },
  },
  faq: {
    eyebrow: faqSection.eyebrow,
    title: faqSection.title,
    description: faqSection.description,
    action: { label: 'View all FAQ', href: '/contact' },
    items: faqCards,
  },
  pricing: {
    eyebrow: 'Plans & Pricing',
    title: 'Plans for Every Journey',
    description:
      'Start free. Scale as you grow. All plans include powerful AI and privacy-first design.',
    action: { label: 'See all plans', href: '/pricing' },
    tiers: [
      {
        name: 'Free',
        price: '$0',
        cadence: 'forever',
        description: 'Everything you need to start.',
        accent: '#13d9f4',
      },
      {
        name: 'Basic',
        price: '$5',
        cadence: 'per month',
        description: 'Core features for personal use.',
        accent: '#19d69a',
      },
      {
        name: 'Basic+',
        price: '$10',
        cadence: 'per month',
        description: 'More automations and integrations.',
        accent: '#c6f016',
        badge: 'Popular',
      },
      {
        name: 'Premium',
        price: '$15',
        cadence: 'per month',
        description: 'Advanced intelligence and customization.',
        accent: '#dc55f7',
      },
      {
        name: 'Pro',
        price: '$25',
        cadence: 'per month',
        description: 'For teams and professionals.',
        accent: '#ff7a18',
      },
      {
        name: 'Pro+',
        price: '$30',
        cadence: 'per month',
        description: 'Higher limits and faster responses.',
        accent: '#17c9f4',
      },
    ],
  },
  finalCta: {
    title: 'Ready to Take Control?',
    description:
      'Join early, shape what we build, and be part of the next evolution in intelligent living.',
    primaryAction: { label: 'Join the waitlist', href: '#waitlist' },
    secondaryAction: { label: 'Explore updates', href: '/contact' },
  },
} as const

// Compatibility exports for existing consumers of the previous home model.
export const homeSections = atAGlanceSection.carouselSections
export const homePageContent = { sections: homeSections } as const
export const crowdfundingMediaItems = [homeLandingPageContent.funding.video]
export const crowdfundingSection = {
  ...communityFundingSection,
  videos: crowdfundingMediaItems,
} as const
export const pricingPreviewImage = homeLandingPageContent.hero.image
export const pricingPreviewSection = {
  id: 'pricing-preview',
  eyebrow: homeLandingPageContent.pricing.eyebrow,
  title: homeLandingPageContent.pricing.title,
  description: homeLandingPageContent.pricing.description,
  image: pricingPreviewImage,
} as const
export const infographicCarouselProps = { autoScrollInterval: 6_500 } as const
export const productPreviewCarouselProps = { maxImages: 5 } as const
