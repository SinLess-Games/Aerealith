import {
  useEffect,
  useId,
  useState,
  useCallback,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'

import { cn } from '../lib/cn'

interface CarouselItemBase {
  /** Optional accessible label announced for the active item. */
  label?: string
}

export interface CarouselImageItem extends CarouselItemBase {
  type: 'image'
  src: string
  alt: string
  objectFit?: 'contain' | 'cover'
}

export interface CarouselVideoItem extends CarouselItemBase {
  type: 'video'
  src: string
  poster?: string
  /** Starts playback when the video becomes active. Browsers require muted autoplay. */
  autoPlay?: boolean
  controls?: boolean
  loop?: boolean
  muted?: boolean
}

export interface CarouselComponentItem extends CarouselItemBase {
  type: 'component'
  content: ReactNode
}

export interface PresentationSlide {
  /** Image URL for an exported PowerPoint slide. */
  src?: string
  alt?: string
  /** Custom slide content, useful for presentations authored in React. */
  content?: ReactNode
}

export interface CarouselPresentationItem extends CarouselItemBase {
  type: 'presentation'
  slides: readonly PresentationSlide[]
  /** Automatically advances presentation slides. */
  autoPlay?: boolean
  /** Time each presentation slide remains visible, in milliseconds. */
  slideTime?: number
}

export type CarouselItem =
  | CarouselImageItem
  | CarouselVideoItem
  | CarouselComponentItem
  | CarouselPresentationItem

export interface CarouselProps extends Omit<
  ComponentPropsWithoutRef<'section'>,
  'onChange'
> {
  items: readonly CarouselItem[]
  /** Automatically advances carousel items. */
  autoScroll?: boolean
  /** Time each carousel item remains visible, in milliseconds. */
  autoScrollInterval?: number
  /** Index used when the carousel is uncontrolled. */
  defaultIndex?: number
  /** Controlled active item index. */
  index?: number
  /** Called whenever the active item changes. */
  onIndexChange?: (index: number) => void
  /** Pauses automatic movement while pointer or keyboard focus is inside. */
  pauseOnInteraction?: boolean
  /** Shows previous/next controls. */
  showControls?: boolean
  /** Shows item position buttons. */
  showIndicators?: boolean
}

export function Carousel({
  'aria-label': ariaLabel = 'Content carousel',
  autoScroll = false,
  autoScrollInterval = 5_000,
  className,
  defaultIndex = 0,
  index,
  items,
  onBlur,
  onFocus,
  onIndexChange,
  onMouseEnter,
  onMouseLeave,
  pauseOnInteraction = true,
  showControls = true,
  showIndicators = true,
  ...props
}: CarouselProps) {
  const [internalIndex, setInternalIndex] = useState(() =>
    normalizeIndex(defaultIndex, items.length),
  )
  const [paused, setPaused] = useState(false)
  const currentIndex = normalizeIndex(index ?? internalIndex, items.length)
  const titleId = useId()

  const goTo = useCallback(
    (nextIndex: number) => {
      const normalizedIndex = normalizeIndex(nextIndex, items.length)
      if (index === undefined) setInternalIndex(normalizedIndex)
      onIndexChange?.(normalizedIndex)
    },
    [index, items.length, onIndexChange],
  )

  useEffect(() => {
    if (!autoScroll || paused || items.length < 2) return
    const timer = window.setInterval(
      () => goTo(currentIndex + 1),
      autoScrollInterval,
    )
    return () => window.clearInterval(timer)
  }, [autoScroll, autoScrollInterval, currentIndex, goTo, items.length, paused])

  if (items.length === 0) return null

  const currentItem = items[currentIndex]

  return (
    <section
      {...props}
      aria-label={ariaLabel}
      aria-roledescription='carousel'
      className={cn('relative overflow-hidden', className)}
      data-slot='carousel'
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
        onBlur?.(event)
      }}
      onFocus={(event) => {
        if (pauseOnInteraction) setPaused(true)
        onFocus?.(event)
      }}
      onMouseEnter={(event) => {
        if (pauseOnInteraction) setPaused(true)
        onMouseEnter?.(event)
      }}
      onMouseLeave={(event) => {
        setPaused(false)
        onMouseLeave?.(event)
      }}
    >
      <span className='sr-only' id={titleId}>
        {currentItem.label ?? `Item ${currentIndex + 1} of ${items.length}`}
      </span>

      <div
        aria-labelledby={titleId}
        aria-live={autoScroll ? 'off' : 'polite'}
        className='h-full w-full'
        data-slot='carousel-item'
        role='group'
      >
        <CarouselItemContent item={currentItem} />
      </div>

      {showControls && items.length > 1 && (
        <div className='absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-2'>
          <button
            aria-label='Previous item'
            className='rounded-full bg-black/60 px-3 py-2 text-white'
            data-slot='carousel-previous'
            onClick={() => goTo(currentIndex - 1)}
            type='button'
          >
            ‹
          </button>
          <button
            aria-label='Next item'
            className='rounded-full bg-black/60 px-3 py-2 text-white'
            data-slot='carousel-next'
            onClick={() => goTo(currentIndex + 1)}
            type='button'
          >
            ›
          </button>
        </div>
      )}

      {showIndicators && items.length > 1 && (
        <div
          aria-label='Choose carousel item'
          className='absolute inset-x-0 bottom-2 flex justify-center gap-2'
          role='group'
        >
          {items.map((item, itemIndex) => (
            <button
              aria-label={`Show ${item.label ?? `item ${itemIndex + 1}`}`}
              aria-pressed={itemIndex === currentIndex}
              className='size-2 rounded-full bg-white/60 aria-pressed:bg-white'
              key={`${item.type}-${itemIndex}`}
              onClick={() => goTo(itemIndex)}
              type='button'
            />
          ))}
        </div>
      )}
    </section>
  )
}

function CarouselItemContent({ item }: { item: CarouselItem }) {
  if (item.type === 'image') {
    return (
      <img
        alt={item.alt}
        className={cn(
          'h-full w-full',
          item.objectFit === 'contain' ? 'object-contain' : 'object-cover',
        )}
        src={item.src}
      />
    )
  }

  if (item.type === 'video') {
    return (
      <video
        autoPlay={item.autoPlay}
        className='h-full w-full'
        controls={item.controls ?? true}
        loop={item.loop}
        muted={item.muted ?? item.autoPlay}
        playsInline
        poster={item.poster}
        src={item.src}
      />
    )
  }

  if (item.type === 'presentation') {
    return <PresentationPlayer item={item} />
  }

  return <>{item.content}</>
}

function PresentationPlayer({ item }: { item: CarouselPresentationItem }) {
  const [slideIndex, setSlideIndex] = useState(0)
  const slideTime = item.slideTime ?? 5_000

  useEffect(() => {
    if (!item.autoPlay || item.slides.length < 2) return
    const timer = window.setInterval(
      () => setSlideIndex((current) => (current + 1) % item.slides.length),
      slideTime,
    )
    return () => window.clearInterval(timer)
  }, [item.autoPlay, item.slides.length, slideTime])

  if (item.slides.length === 0) return null
  const slide = item.slides[slideIndex]

  return (
    <div
      aria-label={`Presentation slide ${slideIndex + 1} of ${item.slides.length}`}
      className='h-full w-full'
      data-slot='presentation-player'
      role='group'
    >
      {slide.content ?? (
        <img
          alt={slide.alt ?? `Slide ${slideIndex + 1}`}
          className='h-full w-full object-contain'
          src={slide.src}
        />
      )}
    </div>
  )
}

function normalizeIndex(index: number, itemCount: number): number {
  if (itemCount === 0) return 0
  return ((index % itemCount) + itemCount) % itemCount
}
