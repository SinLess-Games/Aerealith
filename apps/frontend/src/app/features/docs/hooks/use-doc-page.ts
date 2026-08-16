import { useCallback, useEffect, useMemo, useState } from 'react'

import { useLocation, useParams } from 'react-router'

import { preloadDoc } from '../../../../lib/docs-client'
import {
  getAudienceFromDocsUrl,
  getDocPage,
  getNextDoc,
  getPreviousDoc,
  type DocsAudience,
  type DocsPage,
} from '../../../../lib/docs-source'

export type DocPageStatus = 'loading' | 'ready' | 'not-found' | 'error'

export interface UseDocPageOptions {
  /**
   * Explicit documentation audience.
   *
   * When omitted, the audience is derived from the current URL.
   */
  audience?: DocsAudience

  /**
   * Explicit documentation slug.
   *
   * When omitted, the hook uses the React Router wildcard parameter.
   */
  slug?: string | readonly string[]

  /**
   * Include pages marked as drafts.
   *
   * When omitted, `docs-source.ts` applies its environment-specific default.
   */
  includeDraft?: boolean

  /**
   * Include hidden pages when calculating previous and next navigation.
   *
   * Hidden pages remain directly addressable regardless of this setting.
   */
  includeHiddenInNavigation?: boolean
}

export interface UseDocPageResult {
  /**
   * Resolved documentation audience.
   */
  audience?: DocsAudience

  /**
   * Resolved documentation page.
   */
  page?: DocsPage

  /**
   * Generated Fumadocs document path.
   *
   * Pass this path to `useDocContent()` after the status becomes `ready`.
   */
  path?: string

  /**
   * Previous visible documentation page.
   */
  previousPage?: DocsPage

  /**
   * Next visible documentation page.
   */
  nextPage?: DocsPage

  /**
   * Current page-loading state.
   */
  status: DocPageStatus

  /**
   * Error produced while preloading the compiled MDX document.
   */
  error?: Error

  isLoading: boolean
  isReady: boolean
  isNotFound: boolean
  isError: boolean

  /**
   * Retry loading the current compiled MDX document.
   */
  reload: () => void
}

interface PreloadResult {
  error?: Error
  path: string
  revision: number
  status: 'ready' | 'error'
}

/**
 * Resolves and preloads the documentation page matching the current route.
 *
 * The hook handles:
 *
 * - Audience resolution
 * - React Router wildcard slug resolution
 * - Documentation metadata lookup
 * - Fumadocs browser-content preloading
 * - Previous and next page navigation
 * - Retryable loading errors
 */
export function useDocPage(
  options: Readonly<UseDocPageOptions> = {},
): UseDocPageResult {
  const {
    audience: explicitAudience,
    includeDraft,
    includeHiddenInNavigation = false,
    slug: explicitSlug,
  } = options

  const location = useLocation()
  const routeParams = useParams<'*'>()

  const [revision, setRevision] = useState(0)
  const [preloadResult, setPreloadResult] = useState<PreloadResult>()

  const audience = explicitAudience ?? getAudienceFromDocsUrl(location.pathname)

  const routeSlug = routeParams['*']

  const resolvedSlug = useMemo(
    () => explicitSlug ?? routeSlug,
    [explicitSlug, routeSlug],
  )

  const page = useMemo(() => {
    if (!audience) return undefined

    return getDocPage(audience, resolvedSlug, {
      includeDraft,
    })
  }, [audience, includeDraft, resolvedSlug])

  const pagePath = page?.path

  useEffect(() => {
    if (!pagePath) return

    let cancelled = false

    void preloadDoc(pagePath).then(
      () => {
        if (cancelled) return

        setPreloadResult({
          path: pagePath,
          revision,
          status: 'ready',
        })
      },
      (reason: unknown) => {
        if (cancelled) return

        setPreloadResult({
          error: normalizeError(reason),
          path: pagePath,
          revision,
          status: 'error',
        })
      },
    )

    return () => {
      cancelled = true
    }
  }, [pagePath, revision])

  const navigationOptions = useMemo(
    () => ({
      includeDraft,
      includeHidden: includeHiddenInNavigation,
    }),
    [includeDraft, includeHiddenInNavigation],
  )

  const previousPage = useMemo(
    () => (page ? getPreviousDoc(page, navigationOptions) : undefined),
    [navigationOptions, page],
  )

  const nextPage = useMemo(
    () => (page ? getNextDoc(page, navigationOptions) : undefined),
    [navigationOptions, page],
  )

  const isCurrentResult =
    pagePath !== undefined &&
    preloadResult?.path === pagePath &&
    preloadResult.revision === revision

  const status = resolveStatus({
    hasPage: page !== undefined,
    isCurrentResult,
    preloadResult,
  })

  const error = status === 'error' ? preloadResult?.error : undefined

  const reload = useCallback(() => {
    setRevision((currentRevision) => currentRevision + 1)
  }, [])

  return {
    audience,
    page,
    path: pagePath,
    previousPage,
    nextPage,
    status,
    error,

    isLoading: status === 'loading',
    isReady: status === 'ready',
    isNotFound: status === 'not-found',
    isError: status === 'error',

    reload,
  }
}

interface ResolveStatusOptions {
  hasPage: boolean
  isCurrentResult: boolean
  preloadResult?: PreloadResult
}

function resolveStatus({
  hasPage,
  isCurrentResult,
  preloadResult,
}: ResolveStatusOptions): DocPageStatus {
  if (!hasPage) {
    return 'not-found'
  }

  if (!isCurrentResult || !preloadResult) {
    return 'loading'
  }

  return preloadResult.status
}

function normalizeError(reason: unknown): Error {
  if (reason instanceof Error) {
    return reason
  }

  if (typeof reason === 'string' && reason.trim().length > 0) {
    return new Error(reason)
  }

  return new Error('The documentation page could not be loaded.')
}

export default useDocPage
