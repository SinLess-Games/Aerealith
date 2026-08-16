import type { BackgroundContent } from './background.types'
import type { CarouselContent, CarouselItem } from './carousel.types'
import type { ContentLink, PublicationDetails } from './shared.types'

export interface PageMetadata extends PublicationDetails {
  readonly title: string
  readonly description: string
  readonly canonicalUrl?: string
  readonly image?: string
  readonly noIndex?: boolean
  readonly keywords?: readonly string[]
}

export interface HeroContent<TMedia = CarouselItem> {
  readonly eyebrow?: string
  readonly title: string
  readonly description?: string
  readonly actions?: readonly ContentLink[]
  readonly background?: BackgroundContent
  readonly media?: TMedia
}

/** A reusable page section whose payload can be narrowed by each page. */
export interface PageSection<TContent = unknown> {
  readonly id: string
  readonly type: string
  readonly title?: string
  readonly description?: string
  readonly content: TContent
  readonly background?: BackgroundContent
  readonly hidden?: boolean
}

/** Shared shape for content-driven pages across the application. */
export interface PageContent<
  TSection extends PageSection = PageSection,
  THero extends HeroContent = HeroContent,
> {
  readonly slug: string
  /** Locale tag such as `en`, `en-US`, or `fr-CA`. */
  readonly locale?: string
  readonly metadata: PageMetadata
  readonly hero?: THero
  readonly sections: readonly TSection[]
}

export type CarouselSection<
  TComponentProps = Readonly<Record<string, unknown>>,
> = PageSection<CarouselContent<TComponentProps>> & {
  readonly type: 'carousel'
}
