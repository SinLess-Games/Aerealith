export type ImageFit = 'contain' | 'cover'

export interface ImageContent {
  readonly type: 'image'
  readonly id?: string
  readonly src: string
  readonly alt: string
  readonly width?: number
  readonly height?: number
  readonly fit?: ImageFit
  readonly caption?: string
}

export interface VideoSource {
  readonly src: string
  readonly type?: string
}

export interface VideoContent {
  readonly type: 'video'
  readonly id?: string
  readonly src: string
  readonly sources?: readonly VideoSource[]
  readonly title: string
  readonly poster?: string
  readonly captions?: string
  readonly transcript?: string
  readonly autoPlay?: boolean
  readonly controls?: boolean
  readonly loop?: boolean
  readonly muted?: boolean
}

/**
 * Serializable reference to a component registered by the consuming app.
 *
 * `component` is a registry key rather than an import or React node. `props`
 * can be narrowed per page or component registry.
 */
export interface ComponentContent<TProps = Readonly<Record<string, unknown>>> {
  readonly type: 'component'
  readonly id?: string
  readonly component: string
  readonly props: TProps
  readonly label?: string
}

export type MediaContent<TComponentProps = Readonly<Record<string, unknown>>> =
  ImageContent | VideoContent | ComponentContent<TComponentProps>
