export type HomeSectionComponent =
  'marketing-section' | 'crowdfunding-section' | 'pricing-preview-section'

export interface HomeSectionSummaryContent {
  readonly eyebrow?: string
  readonly title: string
  readonly description?: string
  readonly body?: string
}

export interface HomeMarketingSectionContent extends HomeSectionSummaryContent {
  readonly component: 'marketing-section'
  readonly id: string
}

export interface HomeContentSectionPayload extends HomeSectionSummaryContent {
  readonly eyebrow?: string
}

export interface HomeDifferentiatorItem {
  readonly id?: string
  readonly title: string
  readonly description: string
  readonly icon?: string
  readonly badge?: string
}

export interface HomeCrowdfundingVideoContent {
  readonly id?: string
  readonly title?: string
  readonly description?: string
  readonly src: string
  readonly poster?: string
  readonly controls?: boolean
  readonly muted?: boolean
  readonly loop?: boolean
  readonly autoPlay?: boolean
  readonly playsInline?: boolean
  readonly preload?: 'none' | 'metadata' | 'auto'
}

export interface HomeCrowdfundingSectionContent extends HomeSectionSummaryContent {
  readonly id: string
  readonly videos?: readonly HomeCrowdfundingVideoContent[]
}

export interface HomeFaqCardItem {
  readonly id: string
  readonly question: string
  readonly answer: string
  readonly tag: string
  readonly title: string
  readonly description: string
}

export interface HomeFaqSectionContent extends HomeSectionSummaryContent {
  readonly variant?:
    'default' | 'plain' | 'surface' | 'glass' | 'gradient' | 'dark'
  readonly spacingY?: 'none' | 'compact' | 'normal' | 'spacious'
  readonly align?: 'left' | 'center' | 'right'
  readonly tone?:
    'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  readonly copyVariant?: 'default' | 'hero' | 'section' | 'compact' | 'callout'
  readonly maxWidth?: number | string
  readonly copyMaxWidth?: number | string
  readonly mediaMaxWidth?: number | string
  readonly centerContent?: boolean
  readonly id: string
  readonly cards: readonly HomeFaqCardItem[]
  readonly carousel: {
    readonly autoScroll?: boolean
    readonly autoScrollInterval?: number
    readonly pauseOnHover?: boolean
    readonly pauseOnFocus?: boolean
    readonly loop?: boolean
    readonly showArrows?: boolean
    readonly showPagination?: boolean
    readonly showProgress?: boolean
    readonly pageSize?: number
    readonly transitionMs?: number
  }
}

export interface HomePricingPreviewSectionContent extends HomeSectionSummaryContent {
  readonly id: string
  readonly image?: {
    readonly src: string
    readonly alt: string
  }
  readonly maxWidth?: number | string
  readonly copyMaxWidth?: number | string
  readonly descriptionMaxWidth?: number | string
  readonly bodyMaxWidth?: number | string
  readonly mediaMaxWidth?: number | string
  readonly mediaPosition?: 'left' | 'right' | 'top' | 'bottom'
  readonly centerContent?: boolean
}

export interface HomeWhyAerealithAiSectionContent extends HomeMarketingSectionContent {
  readonly features?: readonly HomeDifferentiatorItem[]
}

export interface HomeCommunityFundingSectionContent extends HomeSectionSummaryContent {
  readonly id: string
  readonly videos?: readonly HomeCrowdfundingVideoContent[]
}

export interface HomeCrowdfundingSectionPayload {
  readonly component: 'crowdfunding-section'
  readonly id: string
  readonly content: HomeContentSectionPayload
}

export interface HomePricingPreviewSectionPayload {
  readonly component: 'pricing-preview-section'
  readonly id: string
  readonly content: HomeContentSectionPayload
}

export type HomeCarouselSectionContent =
  | HomeMarketingSectionContent
  | HomeCrowdfundingSectionPayload
  | HomePricingPreviewSectionPayload

export interface AtAGlanceSectionContent {
  readonly eyebrow: string
  readonly title: string
  readonly description: string
  readonly carouselSections: readonly HomeCarouselSectionContent[]
}
