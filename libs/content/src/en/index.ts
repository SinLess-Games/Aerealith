import {
  AboutContent,
  AboutDescription,
  AboutHeader,
  AboutImage,
} from './about'
import {
  ContactDescription,
  ContactHeader,
  ContactImage,
  contactOptions,
} from './contact'
import { footerProps } from './footer'
import {
  HERO_DATA,
  INVESTOR_VIDEO,
  atAGlanceSection,
  communityFundingSection,
  faqSection,
  pricingPreviewSection,
  whyAerealithAiSection,
} from './home'
import { englishPolicies } from './policies'
import { profileEditOptions, profileScaffoldContent } from './profile'

export * from './about'
export * from './contact'
export * from './footer'
export * from './home'
export * from './policies'
export * from './profile'

/** Canonical, handwritten English content grouped by translation namespace. */
export const englishContent = {
  about: {
    header: AboutHeader,
    description: AboutDescription,
    image: AboutImage,
    sections: AboutContent,
  },
  contact: {
    header: ContactHeader,
    description: ContactDescription,
    image: ContactImage,
    options: contactOptions,
  },
  footer: footerProps,
  home: {
    hero: HERO_DATA,
    investorVideo: INVESTOR_VIDEO,
    atAGlance: atAGlanceSection,
    crowdfunding: communityFundingSection,
    different: whyAerealithAiSection,
    faq: faqSection,
    pricing: pricingPreviewSection,
  },
  policies: englishPolicies,
  profile: {
    scaffold: profileScaffoldContent,
    editOptions: profileEditOptions,
  },
} as const

export type EnglishContent = typeof englishContent
