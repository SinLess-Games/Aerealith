/** A reusable navigation or call-to-action link. */
export interface ContentLink {
  readonly label: string
  readonly href: string
  readonly external?: boolean
  readonly ariaLabel?: string
}

/** Common publication information for reusable content. */
export interface PublicationDetails {
  readonly publishedAt?: string
  readonly updatedAt?: string
  readonly author?: string
}
