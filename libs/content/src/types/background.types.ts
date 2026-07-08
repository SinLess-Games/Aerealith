import type { ImageFit } from './media.types'

export type BackgroundMode = 'auto' | 'light' | 'dark'

/** Theme-aware background imagery shared by heroes, sections, and layouts. */
export interface BackgroundContent {
  readonly image: string
  readonly darkImage?: string
  readonly mode?: BackgroundMode
  readonly position?: string
  readonly fit?: ImageFit
  readonly overlay?: string
}
