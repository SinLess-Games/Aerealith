import {
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from 'react'

import { cn } from '../lib/cn'

export type BackgroundMode = 'auto' | 'light' | 'dark'

export interface BackgroundProps extends ComponentPropsWithoutRef<'div'> {
  /** The image used in light mode and as the default image. */
  lightImage: string

  /** The image used in dark mode. Falls back to `lightImage` when omitted. */
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
  lightImage,
  mode = 'auto',
  style,
  ...props
}: Readonly<BackgroundProps>) {
  const resolvedTheme = useResolvedTheme(mode)
  const resolvedLightImage = toCssUrl(lightImage)
  const resolvedDarkImage = toCssUrl(darkImage ?? lightImage)

  const backgroundStyle: BackgroundStyle = {
    ...style,
    '--ae-background-image': resolvedLightImage,
    '--ae-background-image-dark': resolvedDarkImage,
  }

  return (
    <div
      {...props}
      className={cn('ae-background bg-cover bg-center bg-no-repeat', className)}
      data-mode={resolvedTheme}
      data-slot='background'
      style={backgroundStyle}
    >
      {children}
    </div>
  )
}

function useResolvedTheme(mode: BackgroundMode): BackgroundMode {
  return useSyncExternalStore(
    (onStoreChange) =>
      mode === 'auto'
        ? subscribeToThemeChanges(onStoreChange)
        : () => undefined,
    () => (mode === 'auto' ? resolveTheme() : mode),
    () => (mode === 'auto' ? 'light' : mode),
  )
}

function subscribeToThemeChanges(onStoreChange: () => void) {
  const root = document.documentElement
  const mediaQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null
  const observer = new MutationObserver(onStoreChange)

  observer.observe(root, {
    attributeFilter: ['data-theme'],
    attributes: true,
  })

  mediaQuery?.addEventListener('change', onStoreChange)

  return () => {
    observer.disconnect()
    mediaQuery?.removeEventListener('change', onStoreChange)
  }
}

function resolveTheme(): BackgroundMode {
  if (typeof document !== 'undefined') {
    const documentTheme = document.documentElement.dataset.theme

    if (documentTheme === 'light' || documentTheme === 'dark') {
      return documentTheme
    }
  }

  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
  ) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  return 'light'
}

function toCssUrl(image: string): string {
  const escapedImage = image.replaceAll('"', String.raw`\"`)
  return `url("${escapedImage}")`
}
