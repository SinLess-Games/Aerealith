import { useMemo, type ComponentPropsWithoutRef, type ReactNode } from 'react'

import { cn } from '@aerealith-ai/ui'
import { Link, useLocation } from 'react-router'

import {
  createDocsUrl,
  getAudienceFromDocsUrl,
  getDocPage,
  type DocsAudience,
  type DocsPage,
} from '../../../../lib/docs-source'

export interface DocsBreadcrumbItem {
  /**
   * Human-readable breadcrumb label.
   */
  label: ReactNode

  /**
   * Navigation destination.
   *
   * The current breadcrumb normally omits this value.
   */
  href?: string

  /**
   * Marks the breadcrumb as the current page.
   */
  current?: boolean
}

export interface DocsBreadcrumbsProps extends Omit<
  ComponentPropsWithoutRef<'nav'>,
  'children'
> {
  /**
   * Explicit breadcrumb entries.
   *
   * When omitted, entries are generated from the current documentation URL.
   */
  items?: readonly DocsBreadcrumbItem[]

  /**
   * Current normalized documentation page.
   *
   * Supplying the page improves the final breadcrumb title and avoids relying
   * exclusively on the URL.
   */
  page?: Pick<DocsPage, 'audience' | 'slug' | 'title' | 'url'>

  /**
   * Explicit audience override.
   */
  audience?: DocsAudience

  /**
   * Include a link back to the main Aerealith site.
   */
  showMainSite?: boolean

  /**
   * Include the documentation landing page.
   */
  showDocumentationRoot?: boolean

  /**
   * Label for the main-site breadcrumb.
   */
  mainSiteLabel?: string

  /**
   * Label for the documentation landing-page breadcrumb.
   */
  documentationLabel?: string

  /**
   * Separator rendered between breadcrumb entries.
   */
  separator?: ReactNode
}

/**
 * Accessible breadcrumbs for Aerealith documentation routes.
 *
 * By default, the component derives its entries from the current React Router
 * location and resolves known page titles through the normalized documentation
 * source.
 */
export function DocsBreadcrumbs({
  audience,
  className,
  documentationLabel = 'Documentation',
  items,
  mainSiteLabel = 'Aerealith',
  page,
  separator,
  showDocumentationRoot = true,
  showMainSite = false,
  ...props
}: Readonly<DocsBreadcrumbsProps>) {
  const location = useLocation()

  const resolvedItems = useMemo(
    () =>
      normalizeBreadcrumbItems(
        items ??
          createAutomaticBreadcrumbs({
            audience,
            documentationLabel,
            mainSiteLabel,
            page,
            pathname: location.pathname,
            showDocumentationRoot,
            showMainSite,
          }),
      ),
    [
      audience,
      documentationLabel,
      items,
      location.pathname,
      mainSiteLabel,
      page,
      showDocumentationRoot,
      showMainSite,
    ],
  )

  if (resolvedItems.length === 0) return null

  const ariaLabel = props['aria-label'] ?? 'Breadcrumb'

  return (
    <nav
      {...props}
      aria-label={ariaLabel}
      className={cn('min-w-0 text-sm', className)}
      data-slot='docs-breadcrumbs'
    >
      <ol
        className={cn(
          'flex min-w-0 flex-wrap items-center gap-y-2',
          'text-[var(--ae-foreground-muted)]',
        )}
      >
        {resolvedItems.map((item, index) => {
          const isFirst = index === 0
          const key = createBreadcrumbKey(item, index)

          return (
            <li key={key} className='flex min-w-0 items-center'>
              {!isFirst ? (
                <span
                  aria-hidden='true'
                  className={cn(
                    'mx-2 grid size-4 shrink-0 place-items-center',
                    'text-[color-mix(in_srgb,var(--ae-foreground-muted)_55%,transparent)]',
                  )}
                >
                  {separator ?? <BreadcrumbSeparatorIcon />}
                </span>
              ) : null}

              {item.current || !item.href ? (
                <span
                  aria-current={item.current ? 'page' : undefined}
                  className={cn(
                    'max-w-[18rem] truncate font-medium',
                    item.current
                      ? 'text-[var(--ae-foreground)]'
                      : 'text-[var(--ae-foreground-muted)]',
                  )}
                  title={getTextLabel(item.label)}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className={cn(
                    'max-w-[18rem] truncate rounded-md',
                    'font-medium text-[var(--ae-foreground-muted)]',
                    'transition duration-150',
                    'hover:text-[var(--ae-accent)]',
                    'focus-visible:outline-2',
                    'focus-visible:outline-offset-2',
                    'focus-visible:outline-[var(--ae-accent)]',
                  )}
                  title={getTextLabel(item.label)}
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

interface CreateAutomaticBreadcrumbsOptions {
  audience?: DocsAudience
  documentationLabel: string
  mainSiteLabel: string
  page?: Pick<DocsPage, 'audience' | 'slug' | 'title' | 'url'>
  pathname: string
  showDocumentationRoot: boolean
  showMainSite: boolean
}

function createAutomaticBreadcrumbs({
  audience,
  documentationLabel,
  mainSiteLabel,
  page,
  pathname,
  showDocumentationRoot,
  showMainSite,
}: CreateAutomaticBreadcrumbsOptions): DocsBreadcrumbItem[] {
  const breadcrumbs: DocsBreadcrumbItem[] = []

  if (showMainSite) {
    breadcrumbs.push({
      href: '/',
      label: mainSiteLabel,
    })
  }

  const normalizedPathname = normalizePathname(pathname)
  const resolvedAudience =
    page?.audience ?? audience ?? getAudienceFromDocsUrl(normalizedPathname)

  const isDocumentationRoot = normalizedPathname === '/documentation'

  if (showDocumentationRoot || isDocumentationRoot) {
    breadcrumbs.push({
      current: isDocumentationRoot,
      href: isDocumentationRoot ? undefined : '/documentation',
      label: documentationLabel,
    })
  }

  if (!resolvedAudience) {
    return breadcrumbs
  }

  const audienceRootUrl = createDocsUrl(resolvedAudience)
  const slug =
    page?.slug ?? extractDocsSlug(normalizedPathname, resolvedAudience)

  const isAudienceRoot = slug.length === 0

  breadcrumbs.push({
    current: isAudienceRoot,
    href: isAudienceRoot ? undefined : audienceRootUrl,
    label: getAudienceLabel(resolvedAudience),
  })

  if (isAudienceRoot) {
    return breadcrumbs
  }

  for (let index = 0; index < slug.length; index += 1) {
    const currentSlug = slug.slice(0, index + 1)
    const isCurrent = index === slug.length - 1
    const matchingPage = getDocPage(resolvedAudience, currentSlug)

    const label =
      isCurrent && page
        ? page.title
        : (matchingPage?.title ?? humanizeSegment(currentSlug.at(-1) ?? ''))

    breadcrumbs.push({
      current: isCurrent,
      href: isCurrent
        ? undefined
        : createDocsUrl(resolvedAudience, currentSlug),
      label,
    })
  }

  return breadcrumbs
}

function normalizeBreadcrumbItems(
  items: readonly DocsBreadcrumbItem[],
): readonly DocsBreadcrumbItem[] {
  const normalizedItems = items.filter(
    (item) =>
      item.label !== null && item.label !== undefined && item.label !== '',
  )

  if (normalizedItems.length === 0) return []

  const hasCurrentItem = normalizedItems.some((item) => item.current)

  if (hasCurrentItem) {
    return normalizedItems
  }

  return normalizedItems.map((item, index) =>
    index === normalizedItems.length - 1
      ? {
          ...item,
          current: true,
          href: undefined,
        }
      : item,
  )
}

function extractDocsSlug(
  pathname: string,
  audience: DocsAudience,
): readonly string[] {
  const segments = pathname.split('/').map(decodePathSegment).filter(Boolean)

  const documentationIndex = segments.indexOf('documentation')

  if (documentationIndex < 0) return []

  const audienceIndex = documentationIndex + 1

  if (segments[audienceIndex] !== audience) {
    return []
  }

  return segments
    .slice(audienceIndex + 1)
    .map(normalizeSlugSegment)
    .filter(Boolean)
}

function normalizePathname(pathname: string): string {
  const normalized = pathname
    .split(/[?#]/, 1)
    .at(0)
    ?.replaceAll(/\/+/g, '/')
    .replace(/\/$/, '')

  return normalized || '/'
}

function normalizeSlugSegment(segment: string): string {
  return segment.trim().toLowerCase()
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function getAudienceLabel(audience: DocsAudience): string {
  return audience === 'developer' ? 'Developer docs' : 'User docs'
}

function humanizeSegment(segment: string): string {
  return segment
    .replaceAll(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(capitalizeWord)
    .join(' ')
}

function capitalizeWord(word: string): string {
  if (word.length === 0) return word

  return `${word.charAt(0).toUpperCase()}${word.slice(1)}`
}

function createBreadcrumbKey(item: DocsBreadcrumbItem, index: number): string {
  if (item.href) return item.href

  const label = getTextLabel(item.label)

  return `${label || 'breadcrumb'}-${index}`
}

function getTextLabel(label: ReactNode): string | undefined {
  if (typeof label === 'string' || typeof label === 'number') {
    return String(label)
  }

  return undefined
}

function BreadcrumbSeparatorIcon() {
  return (
    <svg
      aria-hidden='true'
      className='size-3.5'
      fill='none'
      viewBox='0 0 16 16'
    >
      <path
        d='m6 3.5 4.5 4.5L6 12.5'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.5'
      />
    </svg>
  )
}

export default DocsBreadcrumbs
