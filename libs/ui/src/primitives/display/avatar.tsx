// libs/ui/src/primitives/display/avatar.tsx

import {
  type ComponentPropsWithoutRef,
  type ReactEventHandler,
  type ReactNode,
  useState,
} from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/cn'

export const avatarVariants = cva(
  [
    'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
    'rounded-full border border-[var(--ae-border)]',
    'bg-[var(--ae-surface)] font-medium text-[var(--ae-foreground)]',
    'select-none',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export type AvatarProps = Readonly<
  Omit<ComponentPropsWithoutRef<'div'>, 'aria-label' | 'children' | 'role'>
> &
  Readonly<
    VariantProps<typeof avatarVariants> & {
      /**
       * A text alternative describing the represented person, organization,
       * workspace, server, or other entity.
       *
       * Use an empty string for decorative avatars.
       */
      readonly alt: string

      /**
       * Optional fallback content shown when no image source is available or
       * when the avatar image cannot be loaded.
       *
       * When omitted, initials are derived from `alt`.
       */
      readonly fallback?: ReactNode

      /**
       * Called when the avatar image cannot be loaded.
       */
      readonly onImageError?: ReactEventHandler<HTMLImageElement>

      /**
       * The image source for the avatar.
       */
      readonly src?: string
    }
  >

/**
 * Displays an image avatar with an accessible text fallback.
 *
 * When an image is unavailable, the component uses the provided fallback
 * content or derives initials from the accessible label.
 *
 * @example
 * <Avatar
 *   alt="Aerie"
 *   src="https://cdn.aerealith.com/avatars/aerie.png"
 * />
 *
 * @example
 * <Avatar alt="SinLess Games" fallback="SG" />
 */
export function Avatar({
  alt,
  className,
  fallback,
  onImageError,
  size,
  src,
  ...props
}: AvatarProps) {
  const [failedImageSource, setFailedImageSource] = useState<
    string | undefined
  >()

  const imageSource = src?.trim() || undefined
  const shouldShowImage =
    imageSource !== undefined && failedImageSource !== imageSource
  const fallbackContent = fallback ?? getAvatarInitials(alt)

  function handleImageError(
    event: Parameters<ReactEventHandler<HTMLImageElement>>[0],
  ) {
    setFailedImageSource(imageSource)
    onImageError?.(event)
  }

  return (
    <div
      {...props}
      aria-hidden={alt.length === 0 ? true : undefined}
      aria-label={shouldShowImage ? undefined : alt || undefined}
      className={cn(avatarVariants({ size }), className)}
      data-slot='avatar'
      role={shouldShowImage || alt.length === 0 ? undefined : 'img'}
    >
      {shouldShowImage ? (
        <img
          alt={alt}
          className='h-full w-full object-cover'
          data-slot='avatar-image'
          onError={handleImageError}
          src={imageSource}
        />
      ) : (
        <span
          aria-hidden='true'
          className='inline-flex h-full w-full items-center justify-center'
          data-slot='avatar-fallback'
        >
          {fallbackContent}
        </span>
      )}
    </div>
  )
}

function getAvatarInitials(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return '?'
  }

  return words
    .slice(0, 2)
    .map((word) => word.slice(0, 1))
    .join('')
    .toLocaleUpperCase()
}
