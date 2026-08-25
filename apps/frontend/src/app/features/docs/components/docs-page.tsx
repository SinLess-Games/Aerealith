import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react'

import { DocsProse, cn } from '@aerealith-ai/ui'
import { Link } from 'react-router'

import { useDocContent } from '../../../../lib/docs-client'
import type {
  DocsAudience,
  DocsPage as DocsPageData,
} from '../../../../lib/docs-source'
import { useDocPage } from '../hooks/use-doc-page'
import { DocsBreadcrumbs } from './docs-breadcrumbs'
import { DocsTableOfContents } from './docs-table-of-contents'
import { getMDXComponents } from './mdx-components'

export interface DocsPageProps {
  audience: DocsAudience
}

export function DocsPage({ audience }: Readonly<DocsPageProps>) {
  const result = useDocPage({ audience })

  usePageMetadata(result.page)

  if (result.isNotFound) {
    return <DocsPageNotFound />
  }

  if (result.isError) {
    return (
      <DocsPageState title='Unable to load this document'>
        <p>
          {result.error?.message ?? 'The MDX document could not be loaded.'}
        </p>
        <button
          className='mt-5 rounded-xl bg-[var(--ae-accent)] px-4 py-2 font-semibold text-[var(--ae-background)]'
          onClick={result.reload}
          type='button'
        >
          Try again
        </button>
      </DocsPageState>
    )
  }

  if (result.isLoading || !result.page || !result.path) {
    return (
      <DocsPageState title='Loading documentation'>
        <div
          aria-hidden='true'
          className='mt-6 h-2 w-full animate-pulse rounded-full bg-[var(--ae-border)]'
        />
      </DocsPageState>
    )
  }

  return (
    <div className='xl:grid xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-10'>
      <div className='min-w-0'>
        <DocsBreadcrumbs page={result.page} />

        {result.page.draft ? (
          <p className='mt-5 inline-flex rounded-full border border-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider'>
            Draft
          </p>
        ) : null}

        <DocsProse className='mt-7'>
          <DocsRenderBoundary area='document content'>
            <LoadedMdx path={result.path} />
          </DocsRenderBoundary>
        </DocsProse>

        <DocsPager
          nextPage={result.nextPage}
          previousPage={result.previousPage}
        />
      </div>

      <DocsRenderBoundary area='table of contents' fallback={null}>
        <DocsTableOfContents page={result.page} />
      </DocsRenderBoundary>
    </div>
  )
}

interface DocsRenderBoundaryProps {
  area: string
  children: ReactNode
  fallback?: ReactNode
}

interface DocsRenderBoundaryState {
  error?: Error
}

/**
 * Keeps an optional documentation enhancement from taking down the complete
 * application shell. In development, the original browser error is shown so
 * failures do not get hidden behind the global generic 500 page.
 */
class DocsRenderBoundary extends Component<
  DocsRenderBoundaryProps,
  DocsRenderBoundaryState
> {
  override state: DocsRenderBoundaryState = {}

  static getDerivedStateFromError(error: Error): DocsRenderBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Documentation ${this.props.area} failed`, error, info)
  }

  override render() {
    const { error } = this.state

    if (!error) return this.props.children
    if (this.props.fallback !== undefined) return this.props.fallback

    return (
      <aside
        className='my-6 rounded-xl border border-red-500/40 bg-red-500/10 p-5'
        role='alert'
      >
        <h2 className='text-lg font-semibold'>
          Unable to render {this.props.area}
        </h2>
        <p className='mt-2 text-sm text-[var(--ae-foreground-muted)]'>
          {process.env.NODE_ENV === 'production'
            ? 'This document could not be displayed.'
            : error.message}
        </p>
      </aside>
    )
  }
}

function LoadedMdx({ path }: Readonly<{ path: string }>) {
  return useDocContent(path, {
    components: getMDXComponents(),
  })
}

function DocsPager({
  nextPage,
  previousPage,
}: Readonly<{
  nextPage?: DocsPageData
  previousPage?: DocsPageData
}>) {
  if (!nextPage && !previousPage) return null

  return (
    <nav
      aria-label='Previous and next documentation'
      className='mt-14 grid gap-4 border-t border-[var(--ae-border)] pt-6 sm:grid-cols-2'
    >
      {previousPage ? (
        <PagerLink direction='Previous' page={previousPage} />
      ) : (
        <span />
      )}
      {nextPage ? <PagerLink direction='Next' page={nextPage} right /> : null}
    </nav>
  )
}

function PagerLink({
  direction,
  page,
  right = false,
}: Readonly<{
  direction: string
  page: DocsPageData
  right?: boolean
}>) {
  return (
    <Link
      className={cn(
        'rounded-2xl border border-[var(--ae-border)] p-4 transition',
        'hover:border-[var(--ae-accent)] hover:bg-[var(--ae-surface)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-[var(--ae-accent)]',
        right && 'text-right',
      )}
      to={page.url}
    >
      <span className='block text-xs font-semibold uppercase tracking-wider text-[var(--ae-foreground-muted)]'>
        {direction}
      </span>
      <span className='mt-1 block font-semibold'>{page.title}</span>
    </Link>
  )
}

function DocsPageState({
  children,
  title,
}: Readonly<{ children?: ReactNode; title: string }>) {
  return (
    <section
      aria-live='polite'
      className='mx-auto max-w-3xl rounded-3xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-8'
    >
      <h1 className='text-3xl font-semibold'>{title}</h1>
      {children}
    </section>
  )
}

function DocsPageNotFound() {
  return (
    <DocsPageState title='Documentation page not found'>
      <p className='mt-3 text-[var(--ae-foreground-muted)]'>
        This address does not match a published document.
      </p>
      <Link
        className='mt-6 inline-flex font-semibold text-[var(--ae-accent)] underline'
        to='/documentation'
      >
        Return to documentation
      </Link>
    </DocsPageState>
  )
}

function usePageMetadata(page?: DocsPageData) {
  useEffect(() => {
    if (!page) return

    window.document.title = `${page.title} | Aerealith Documentation`

    const description = ensureMetaDescription()
    description.content = page.description

    const canonical = ensureCanonicalLink()
    canonical.href = new URL(page.url, window.location.origin).href
  }, [page])
}

function ensureMetaDescription() {
  const existing = window.document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  )
  if (existing) return existing

  const element = window.document.createElement('meta')
  element.name = 'description'
  window.document.head.appendChild(element)
  return element
}

function ensureCanonicalLink() {
  const existing = window.document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  )
  if (existing) return existing

  const element = window.document.createElement('link')
  element.rel = 'canonical'
  window.document.head.appendChild(element)
  return element
}
