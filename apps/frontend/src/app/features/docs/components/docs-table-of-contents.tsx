import {
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
} from 'react'

import { cn } from '@aerealith-ai/ui'

import type { DocsHeading, DocsPage } from '../../../../lib/docs-source'

export interface DocsTableOfContentsProps extends Omit<
  ComponentPropsWithoutRef<'aside'>,
  'children'
> {
  /**
   * Explicit heading collection.
   *
   * When omitted, headings are read from the supplied documentation page.
   */
  headings?: readonly DocsHeading[]

  /**
   * Documentation page containing generated table-of-contents headings.
   */
  page?: Pick<DocsPage, 'headings'>

  /**
   * Accessible and visible title above the table of contents.
   */
  label?: string

  /**
   * Small text displayed above the main label.
   */
  eyebrow?: string

  /**
   * Lowest heading depth included.
   */
  minDepth?: number

  /**
   * Highest heading depth included.
   */
  maxDepth?: number

  /**
   * Keep the table of contents visible while scrolling.
   */
  sticky?: boolean

  /**
   * Hide the component when no headings are available.
   */
  hideWhenEmpty?: boolean

  /**
   * Maximum height of the scrollable heading list.
   */
  maxHeightClassName?: string
}

interface NormalizedHeading {
  depth: number
  id: string
  title: string
  url: string
}

/**
 * Documentation page table of contents with active-heading tracking.
 *
 * Generated Fumadocs headings are normalized into same-page anchors. An
 * IntersectionObserver watches the corresponding document sections and marks
 * the currently visible heading.
 */
export function DocsTableOfContents({
  className,
  eyebrow = 'Page navigation',
  headings,
  hideWhenEmpty = true,
  label = 'On this page',
  maxDepth = 4,
  maxHeightClassName = 'max-h-[calc(100vh-11rem)]',
  minDepth = 2,
  page,
  sticky = true,
  ...props
}: Readonly<DocsTableOfContentsProps>) {
  const normalizedHeadings = useMemo(
    () =>
      normalizeHeadings(headings ?? page?.headings ?? [], minDepth, maxDepth),
    [headings, maxDepth, minDepth, page?.headings],
  )

  const activeHeadingId = useActiveHeading(normalizedHeadings)

  if (normalizedHeadings.length === 0 && hideWhenEmpty) {
    return null
  }

  const activeIndex = normalizedHeadings.findIndex(
    (heading) => heading.id === activeHeadingId,
  )

  const progress =
    activeIndex < 0 || normalizedHeadings.length === 0
      ? 0
      : ((activeIndex + 1) / normalizedHeadings.length) * 100

  return (
    <aside
      {...props}
      className={cn('hidden min-w-0 xl:block', className)}
      data-slot='docs-table-of-contents'
    >
      <div
        className={cn(
          sticky && 'sticky top-28',
          maxHeightClassName,
          'overflow-y-auto py-8 pl-2',
        )}
      >
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border',
            'border-[var(--ae-border)]',
            'bg-[color-mix(in_srgb,var(--ae-surface)_62%,transparent)]',
            'shadow-[0_16px_45px_rgba(0,0,0,0.12)]',
            'backdrop-blur-xl',
          )}
        >
          <header
            className={cn('border-b border-[var(--ae-border)]', 'px-4 py-4')}
          >
            <div
              className={cn(
                'text-[0.625rem] font-semibold tracking-[0.16em]',
                'text-[var(--ae-foreground-muted)] uppercase',
              )}
            >
              {eyebrow}
            </div>

            <h2
              className={cn(
                'mt-1 text-sm font-semibold',
                'text-[var(--ae-foreground)]',
              )}
            >
              {label}
            </h2>
          </header>

          {normalizedHeadings.length > 0 ? (
            <>
              <nav aria-label={label} className='relative px-3 py-3'>
                <div
                  aria-hidden='true'
                  className={cn(
                    'absolute top-3 bottom-3 left-[1.15rem]',
                    'w-px bg-[var(--ae-border)]',
                  )}
                />

                <div
                  aria-hidden='true'
                  className={cn(
                    'absolute top-3 left-[1.15rem] w-px',
                    'bg-[var(--ae-accent)]',
                    'shadow-[0_0_10px_var(--ae-accent)]',
                    'transition-[height] duration-300',
                  )}
                  style={{
                    height: `calc((100% - 1.5rem) * ${progress / 100})`,
                  }}
                />

                <ol className='relative space-y-0.5'>
                  {normalizedHeadings.map((heading) => {
                    const isActive = heading.id === activeHeadingId

                    return (
                      <li
                        key={`${heading.url}-${heading.depth}`}
                        className={getDepthSpacing(heading.depth)}
                      >
                        <a
                          href={heading.url}
                          aria-current={isActive ? 'location' : undefined}
                          className={cn(
                            'group relative flex min-h-9 items-start',
                            'gap-2 rounded-lg py-2 pr-2',
                            'text-xs leading-5 font-medium',
                            'transition duration-150',
                            'focus-visible:outline-2',
                            'focus-visible:outline-offset-1',
                            'focus-visible:outline-[var(--ae-accent)]',
                            isActive
                              ? cn(
                                  'bg-[color-mix(in_srgb,var(--ae-accent)_9%,transparent)]',
                                  'text-[var(--ae-accent)]',
                                )
                              : cn(
                                  'text-[var(--ae-foreground-muted)]',
                                  'hover:bg-[color-mix(in_srgb,var(--ae-surface)_78%,transparent)]',
                                  'hover:text-[var(--ae-foreground)]',
                                ),
                          )}
                        >
                          <span
                            aria-hidden='true'
                            className={cn(
                              'relative z-10 mt-[0.4rem] size-1.5',
                              'shrink-0 rounded-full border',
                              'transition duration-150',
                              isActive
                                ? cn(
                                    'border-[var(--ae-accent)]',
                                    'bg-[var(--ae-accent)]',
                                    'shadow-[0_0_8px_var(--ae-accent)]',
                                  )
                                : cn(
                                    'border-[var(--ae-border)]',
                                    'bg-[var(--ae-background)]',
                                    'group-hover:border-[var(--ae-foreground-muted)]',
                                  ),
                            )}
                          />

                          <span className='line-clamp-2 min-w-0'>
                            {heading.title}
                          </span>
                        </a>
                      </li>
                    )
                  })}
                </ol>
              </nav>

              <footer
                className={cn(
                  'flex items-center justify-between gap-3',
                  'border-t border-[var(--ae-border)] px-4 py-3',
                  'text-[0.6875rem]',
                  'text-[var(--ae-foreground-muted)]',
                )}
              >
                <span>
                  {getProgressLabel(activeIndex, normalizedHeadings.length)}
                </span>

                <a
                  href='#docs-main-content'
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md',
                    'font-semibold transition',
                    'hover:text-[var(--ae-accent)]',
                    'focus-visible:outline-2',
                    'focus-visible:outline-offset-2',
                    'focus-visible:outline-[var(--ae-accent)]',
                  )}
                >
                  <span>Top</span>
                  <ArrowUpIcon />
                </a>
              </footer>
            </>
          ) : (
            <div
              className={cn(
                'px-4 py-5 text-sm leading-6',
                'text-[var(--ae-foreground-muted)]',
              )}
            >
              This page does not contain any section headings.
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function useActiveHeading(
  headings: readonly NormalizedHeading[],
): string | undefined {
  const headingKey = headings.map((heading) => heading.id).join('|')

  const [activeHeadingId, setActiveHeadingId] = useState<string | undefined>(
    () => getCurrentHashId(),
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const headingIds = headingKey.split('|').filter(Boolean)

    if (headingIds.length === 0) return

    const elements = headingIds
      .map((id) => document.getElementById(id))
      .filter(
        (element): element is HTMLElement => element instanceof HTMLElement,
      )

    if (elements.length === 0) return

    const updateActiveHeading = () => {
      const nextHeadingId = findActiveHeading(elements)

      setActiveHeadingId((currentHeadingId) =>
        currentHeadingId === nextHeadingId ? currentHeadingId : nextHeadingId,
      )
    }

    const observer =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            () => {
              updateActiveHeading()
            },
            {
              rootMargin: '-7rem 0px -68% 0px',
              threshold: [0, 1],
            },
          )
        : undefined

    for (const element of elements) {
      observer?.observe(element)
    }

    const updateFromHash = () => {
      const hashId = getCurrentHashId()

      if (hashId && headingIds.includes(hashId)) {
        setActiveHeadingId(hashId)
        return
      }

      updateActiveHeading()
    }

    const initialFrame = window.requestAnimationFrame(updateActiveHeading)

    window.addEventListener('hashchange', updateFromHash)

    return () => {
      window.cancelAnimationFrame(initialFrame)
      window.removeEventListener('hashchange', updateFromHash)
      observer?.disconnect()
    }
  }, [headingKey])

  return activeHeadingId
}

function findActiveHeading(
  elements: readonly HTMLElement[],
): string | undefined {
  const headerOffset = 132

  let closestAbove:
    | {
        id: string
        top: number
      }
    | undefined

  let closestBelow:
    | {
        id: string
        top: number
      }
    | undefined

  for (const element of elements) {
    const top = element.getBoundingClientRect().top

    if (top <= headerOffset) {
      if (!closestAbove || top > closestAbove.top) {
        closestAbove = {
          id: element.id,
          top,
        }
      }

      continue
    }

    if (!closestBelow || top < closestBelow.top) {
      closestBelow = {
        id: element.id,
        top,
      }
    }
  }

  return closestAbove?.id ?? closestBelow?.id
}

function normalizeHeadings(
  headings: readonly DocsHeading[],
  minDepth: number,
  maxDepth: number,
): readonly NormalizedHeading[] {
  const safeMinDepth = Math.max(1, Math.floor(minDepth))
  const safeMaxDepth = Math.max(safeMinDepth, Math.floor(maxDepth))

  return headings
    .map(normalizeHeading)
    .filter(
      (heading): heading is NormalizedHeading =>
        heading !== undefined &&
        heading.depth >= safeMinDepth &&
        heading.depth <= safeMaxDepth,
    )
}

function normalizeHeading(heading: DocsHeading): NormalizedHeading | undefined {
  const title = heading.title.trim()

  if (title.length === 0) return undefined

  const rawUrl = heading.url?.trim()

  if (!rawUrl) return undefined

  const url = normalizeHeadingUrl(rawUrl)
  const id = getHeadingId(url)

  if (!id) return undefined

  return {
    depth: normalizeDepth(heading.depth),
    id,
    title,
    url,
  }
}

function normalizeHeadingUrl(url: string): string {
  if (url.startsWith('#')) return url

  const hashIndex = url.indexOf('#')

  if (hashIndex >= 0) {
    return url.slice(hashIndex)
  }

  return `#${url}`
}

function getHeadingId(url: string): string | undefined {
  const id = url.replace(/^#/, '').trim()

  if (id.length === 0) return undefined

  try {
    return decodeURIComponent(id)
  } catch {
    return id
  }
}

function normalizeDepth(depth: number | undefined): number {
  if (typeof depth !== 'number' || !Number.isFinite(depth)) {
    return 2
  }

  return Math.max(1, Math.floor(depth))
}

function getCurrentHashId(): string | undefined {
  if (typeof window === 'undefined') return undefined

  const hash = window.location.hash.replace(/^#/, '')

  if (hash.length === 0) return undefined

  try {
    return decodeURIComponent(hash)
  } catch {
    return hash
  }
}

function getDepthSpacing(depth: number): string {
  if (depth <= 2) {
    return 'pl-0'
  }

  if (depth === 3) {
    return 'pl-3'
  }

  if (depth === 4) {
    return 'pl-6'
  }

  return 'pl-8'
}

function getProgressLabel(activeIndex: number, headingCount: number): string {
  if (headingCount === 0) {
    return 'No sections'
  }

  if (activeIndex < 0) {
    return `${headingCount} ${headingCount === 1 ? 'section' : 'sections'}`
  }

  return `${activeIndex + 1} of ${headingCount}`
}

function ArrowUpIcon() {
  return (
    <svg
      aria-hidden='true'
      className='size-3.5'
      fill='none'
      viewBox='0 0 16 16'
    >
      <path
        d='M8 12.5v-9m0 0L4.5 7M8 3.5 11.5 7'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.4'
      />
    </svg>
  )
}

export default DocsTableOfContents
