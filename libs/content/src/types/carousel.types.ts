import type {
  ComponentContent,
  ImageContent,
  VideoContent,
} from './media.types'
import type { ContentId } from './shared.types'

export type PresentationSlide<
  TComponentProps = Readonly<Record<string, unknown>>,
> = Omit<ImageContent, 'type'> | Omit<ComponentContent<TComponentProps>, 'type'>

export interface PresentationContent<
  TComponentProps = Readonly<Record<string, unknown>>,
> {
  readonly type: 'presentation'
  readonly id?: ContentId
  readonly label: string
  readonly slides: readonly PresentationSlide<TComponentProps>[]
  readonly autoPlay?: boolean
  /** Time each presentation slide remains visible, in milliseconds. */
  readonly slideTime?: number
}

export type CarouselItem<TComponentProps = Readonly<Record<string, unknown>>> =
  | ImageContent
  | VideoContent
  | ComponentContent<TComponentProps>
  | PresentationContent<TComponentProps>

export interface CarouselContent<
  TComponentProps = Readonly<Record<string, unknown>>,
> {
  readonly id?: ContentId
  readonly label?: string
  readonly items: readonly CarouselItem<TComponentProps>[]
  readonly autoScroll?: boolean
  /** Time each carousel item remains visible, in milliseconds. */
  readonly autoScrollInterval?: number
  readonly pauseOnInteraction?: boolean
  readonly showControls?: boolean
  readonly showIndicators?: boolean
  readonly initialIndex?: number
}
