import type { ComponentPropsWithoutRef, CSSProperties } from 'react'

import { cn } from '../lib/cn'

export type BackgroundMode = 'auto' | 'light' | 'dark'

export interface BackgroundProps extends ComponentPropsWithoutRef<'div'> {
  /** The image used in light mode and as the default image. */
  image: string

  /** The image used in dark mode. Falls back to `image` when omitted. */
  darkImage?: string

  /** Whether to follow the OS theme or force a particular image. */
  mode?: BackgroundMode
}

type BackgroundStyle = CSSProperties & {
  '--ae-background-image': string
  '--ae-background-image-dark': string
}

/**
 * A content container with theme-aware background imagery.
 *
 * `auto` follows `prefers-color-scheme`; `light` and `dark` are useful when
 * the surrounding application has an explicit theme override.
 */
export function Background({
  children,
  className,
  darkImage,
  image,
  mode = 'auto',
  style,
  ...props
}: BackgroundProps) {
  const lightImage = toCssUrl(image)
  const resolvedDarkImage = toCssUrl(darkImage ?? image)
  const backgroundStyle: BackgroundStyle = {
    ...style,
    '--ae-background-image': lightImage,
    '--ae-background-image-dark': resolvedDarkImage,
  }

  return (
    <div
      {...props}
      className={cn('ae-background bg-cover bg-center bg-no-repeat', className)}
      data-mode={mode}
      data-slot='background'
      style={backgroundStyle}
    >
      {children}
    </div>
  )
}

function toCssUrl(image: string): string {
  const escapedImage = image.replaceAll('"', '\\"')
  return `url("${escapedImage}")`
}
