import { docsEntries } from './docs-client'

export type DocsAudience = 'user' | 'developer'

export interface DocsHeading {
  depth?: number
  title: string
  url?: string
}

export interface DocsPage {
  /**
   * Documentation audience derived from the first content path segment.
   */
  audience: DocsAudience

  /**
   * Public slug segments after the audience segment.
   *
   * Examples:
   *
   * - `user/index.mdx` becomes `[]`
   * - `user/credits/index.mdx` becomes `['credits']`
   * - `developer/api/authentication.mdx` becomes
   *   `['api', 'authentication']`
   */
  slug: readonly string[]

  /**
   * Public documentation URL.
   */
  url: string

  /**
   * Generated Fumadocs path used by `docsClient.preload()` and
   * `docsClient.useContent()`.
   */
  path: string

  /**
   * Normalized path inside the documentation content directory.
   */
  filePath: string

  title: string
  description: string
  order: number
  keywords: readonly string[]
  headings: readonly DocsHeading[]
  searchText: string

  draft: boolean
  hidden: boolean
  isIndex: boolean

  icon?: string
  badge?: string
  updated?: string
  status?: string
  confidence?: string
  researchType?: string
  owners: readonly string[]
  researchStarted?: string
  decisionDate?: string
  related: readonly string[]
}

export interface DocsTreeNode {
  /**
   * Current filesystem-derived URL segment.
   */
  segment: string

  /**
   * Human-readable label. Folder index metadata takes precedence over a
   * generated label.
   */
  title: string

  /**
   * Folder or page URL when an index/page document exists.
   */
  url?: string

  /**
   * Document represented by this node.
   *
   * A folder node has a page when the folder contains `index.mdx`.
   */
  page?: DocsPage

  children: readonly DocsTreeNode[]
}

export interface DocsTree {
  audience: DocsAudience

  /**
   * The audience root document:
   *
   * - `user/index.mdx`
   * - `developer/index.mdx`
   */
  rootPage?: DocsPage

  children: readonly DocsTreeNode[]
}

export interface GetDocsOptions {
  /**
   * Include pages marked `draft: true`.
   *
   * Drafts are included by default during development and excluded from
   * production.
   */
  includeDraft?: boolean

  /**
   * Include pages marked `hidden: true`.
   *
   * Hidden pages remain directly addressable but are excluded from normal
   * navigation by default.
   */
  includeHidden?: boolean
}

export interface DocsSearchOptions extends GetDocsOptions {
  audience?: DocsAudience
  limit?: number
}

export interface DocsSearchResult {
  page: DocsPage
  score: number
  matchedFields: readonly DocsSearchField[]
}

export type DocsSearchField =
  'title' | 'description' | 'keywords' | 'headings' | 'body' | 'path'

interface RawDocsRecord {
  readonly [key: string]: unknown
}

interface MutableDocsTreeNode {
  segment: string
  page?: DocsPage
  children: Map<string, MutableDocsTreeNode>
}

const docsCollator = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
})

const defaultIncludeDraft = process.env.NODE_ENV !== 'production'

/**
 * Every normalized documentation page, including hidden and draft documents.
 */
export const allDocsPages: readonly DocsPage[] = Object.freeze(
  createDocsPages(docsEntries),
)

/**
 * Documents available in the current environment.
 *
 * Production drafts are excluded. Hidden pages remain available here because
 * hidden documents may still be visited directly.
 */
export const docsPages: readonly DocsPage[] = Object.freeze(
  allDocsPages.filter((page) => isDraftAvailable(page)),
)

/**
 * Resolve a document using an audience and URL slug.
 */
export function getDocPage(
  audience: DocsAudience,
  slug: string | readonly string[] | undefined,
  options: Pick<GetDocsOptions, 'includeDraft'> = {},
): DocsPage | undefined {
  const normalizedSlug = normalizeSlugInput(slug, audience)

  if (!normalizedSlug) return undefined

  const includeDraft = options.includeDraft ?? defaultIncludeDraft

  return allDocsPages.find(
    (page) =>
      page.audience === audience &&
      (includeDraft || !page.draft) &&
      areSegmentsEqual(page.slug, normalizedSlug),
  )
}

/**
 * Return all documents for one audience.
 */
export function getDocsForAudience(
  audience: DocsAudience,
  options: GetDocsOptions = {},
): readonly DocsPage[] {
  const includeDraft = options.includeDraft ?? defaultIncludeDraft
  const includeHidden = options.includeHidden ?? false

  return allDocsPages
    .filter(
      (page) =>
        page.audience === audience &&
        (includeDraft || !page.draft) &&
        (includeHidden || !page.hidden),
    )
    .sort(compareDocsPages)
}

/**
 * Generate a nested navigation tree from filesystem paths.
 */
export function getDocsTree(
  audience: DocsAudience,
  options: GetDocsOptions = {},
): DocsTree {
  const pages = getDocsForAudience(audience, options)

  return buildDocsTree(audience, pages)
}

/**
 * Build an audience tree from document slugs.
 *
 * Every slug segment becomes a folder node, so adding an MD/MDX document
 * inside a new directory automatically adds that directory—and any missing
 * intermediate directories—to the sidebar.
 */
export function buildDocsTree(
  audience: DocsAudience,
  pages: readonly DocsPage[],
): DocsTree {
  const mutableRoot = createMutableTreeNode('')
  let rootPage: DocsPage | undefined

  for (const page of pages) {
    if (page.audience !== audience) continue

    if (page.slug.length === 0) {
      rootPage = page
      continue
    }

    let currentNode = mutableRoot

    for (const segment of page.slug) {
      let childNode = currentNode.children.get(segment)

      if (!childNode) {
        childNode = createMutableTreeNode(segment)
        currentNode.children.set(segment, childNode)
      }

      currentNode = childNode
    }

    currentNode.page = page
  }

  return {
    audience,
    rootPage,
    children: finalizeTreeChildren(mutableRoot),
  }
}

/**
 * Flatten the navigation tree in the same order used by the sidebar.
 */
export function getDocsNavigationPages(
  audience: DocsAudience,
  options: GetDocsOptions = {},
): readonly DocsPage[] {
  const tree = getDocsTree(audience, options)
  const pages: DocsPage[] = []

  if (tree.rootPage) {
    pages.push(tree.rootPage)
  }

  for (const child of tree.children) {
    appendTreePages(child, pages)
  }

  return pages
}

/**
 * Get the previous visible document inside the same audience.
 */
export function getPreviousDoc(
  page: Pick<DocsPage, 'audience' | 'url'>,
  options: GetDocsOptions = {},
): DocsPage | undefined {
  const pages = getDocsNavigationPages(page.audience, options)
  const pageIndex = pages.findIndex((candidate) => candidate.url === page.url)

  if (pageIndex <= 0) return undefined

  return pages[pageIndex - 1]
}

/**
 * Get the next visible document inside the same audience.
 */
export function getNextDoc(
  page: Pick<DocsPage, 'audience' | 'url'>,
  options: GetDocsOptions = {},
): DocsPage | undefined {
  const pages = getDocsNavigationPages(page.audience, options)
  const pageIndex = pages.findIndex((candidate) => candidate.url === page.url)

  if (pageIndex < 0 || pageIndex >= pages.length - 1) {
    return undefined
  }

  return pages[pageIndex + 1]
}

/**
 * Search documentation metadata available in the browser collection.
 */
export function searchDocs(
  query: string,
  options: DocsSearchOptions = {},
): readonly DocsSearchResult[] {
  const normalizedQuery = normalizeSearchValue(query)

  if (normalizedQuery.length === 0) return []

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean)
  const includeDraft = options.includeDraft ?? defaultIncludeDraft
  const includeHidden = options.includeHidden ?? false
  const limit = normalizeSearchLimit(options.limit)

  const results = allDocsPages
    .filter(
      (page) =>
        (!options.audience || page.audience === options.audience) &&
        (includeDraft || !page.draft) &&
        (includeHidden || !page.hidden),
    )
    .map((page) => scoreSearchResult(page, normalizedQuery, queryTokens))
    .filter((result): result is DocsSearchResult => result !== undefined)
    .sort(compareSearchResults)

  return results.slice(0, limit)
}

/**
 * Convert an audience and slug into a public documentation URL.
 */
export function createDocsUrl(
  audience: DocsAudience,
  slug: readonly string[] = [],
): string {
  const encodedSlug = slug.map((segment) => encodeURIComponent(segment))
  const suffix = encodedSlug.length > 0 ? `/${encodedSlug.join('/')}` : ''

  return `/documentation/${audience}${suffix}`
}

/**
 * Determine whether a value is a recognized documentation audience.
 */
export function isDocsAudience(value: unknown): value is DocsAudience {
  return value === 'user' || value === 'developer'
}

/**
 * Extract the audience from a documentation URL.
 */
export function getAudienceFromDocsUrl(
  pathname: string,
): DocsAudience | undefined {
  const segments = normalizePathSegments(pathname)
  const documentationIndex = segments.indexOf('documentation')
  const possibleAudience =
    documentationIndex >= 0 ? segments[documentationIndex + 1] : segments[0]

  return isDocsAudience(possibleAudience) ? possibleAudience : undefined
}

function createDocsPages(entries: unknown): DocsPage[] {
  const pages = getRawEntries(entries)
    .map(createDocsPage)
    .filter((page): page is DocsPage => page !== undefined)

  return deduplicatePages(pages).sort(compareDocsPages)
}

function createDocsPage(entry: unknown): DocsPage | undefined {
  if (!isRecord(entry)) return undefined

  const path = extractGeneratedPath(entry)

  if (!path) return undefined

  const fileSegments = extractContentSegments(path)
  const audienceIndex = fileSegments.findIndex(isDocsAudience)
  const metadata = extractMetadata(entry)

  if (audienceIndex < 0) {
    const metadataAudience = readString(metadata, 'audience')

    if (!isDocsAudience(metadataAudience)) return undefined

    return createPageFromSegments({
      audience: metadataAudience,
      contentSegments: fileSegments,
      entry,
      metadata,
      path,
    })
  }

  const audience = fileSegments[audienceIndex]

  if (!isDocsAudience(audience)) return undefined

  return createPageFromSegments({
    audience,
    contentSegments: fileSegments.slice(audienceIndex + 1),
    entry,
    metadata,
    path,
  })
}

function createPageFromSegments({
  audience,
  contentSegments,
  entry,
  metadata,
  path,
}: {
  audience: DocsAudience
  contentSegments: readonly string[]
  entry: RawDocsRecord
  metadata: RawDocsRecord
  path: string
}): DocsPage | undefined {
  if (contentSegments.length === 0) return undefined

  const normalizedFileSegments = contentSegments.map(removeQueryString)
  const finalFileSegment = normalizedFileSegments.at(-1)

  if (!finalFileSegment) return undefined

  const isIndex = isIndexFile(finalFileSegment)
  const finalSlugSegment = removeMarkdownExtension(finalFileSegment)

  const slug = [
    ...normalizedFileSegments.slice(0, -1),
    ...(isIndex ? [] : [finalSlugSegment]),
  ]
    .map(normalizeContentSegment)
    .filter(Boolean)

  if (!isSafeSlug(slug)) return undefined

  const title =
    readString(metadata, 'title') ?? humanizeSegment(slug.at(-1) ?? audience)

  const description =
    readString(metadata, 'description') ??
    `Aerealith ${audience} documentation for ${title}.`

  return {
    audience,
    slug,
    url: createDocsUrl(audience, slug),
    path,
    filePath: [audience, ...normalizedFileSegments].join('/'),

    title,
    description,
    order: readOrder(metadata),
    keywords: readStringArray(metadata, 'keywords'),
    headings: extractHeadings(entry),
    searchText: readString(entry, 'searchText') ?? '',

    draft: readBoolean(metadata, 'draft') ?? false,
    hidden: readBoolean(metadata, 'hidden') ?? false,
    isIndex,

    icon: readString(metadata, 'icon'),
    badge: readString(metadata, 'badge'),
    updated: readDateValue(metadata, 'updated'),
    status: readString(metadata, 'status'),
    confidence: readString(metadata, 'confidence'),
    researchType: readString(metadata, 'researchType'),
    owners: readStringArray(metadata, 'owners'),
    researchStarted: readDateValue(metadata, 'researchStarted'),
    decisionDate: readDateValue(metadata, 'decisionDate'),
    related: readStringArray(metadata, 'related'),
  }
}

function extractGeneratedPath(entry: RawDocsRecord): string | undefined {
  const info = readRecord(entry, 'info')
  const data = readRecord(entry, 'data')
  const file = readRecord(entry, 'file')

  return (
    readString(entry, 'path') ??
    readString(entry, 'absolutePath') ??
    readString(entry, 'filePath') ??
    readString(info, 'path') ??
    readString(info, 'absolutePath') ??
    readString(data, 'path') ??
    readString(file, 'path')
  )
}

function extractMetadata(entry: RawDocsRecord): RawDocsRecord {
  const info = readRecord(entry, 'info')
  const data = readRecord(entry, 'data')
  const directFrontmatter = readRecord(entry, 'frontmatter')
  const dataFrontmatter = readRecord(data, 'frontmatter')
  const infoFrontmatter = readRecord(info, 'frontmatter')

  return mergeRecords(
    info,
    data,
    infoFrontmatter,
    dataFrontmatter,
    directFrontmatter,
  )
}

function mergeRecords(
  ...records: readonly (RawDocsRecord | undefined)[]
): RawDocsRecord {
  const result: Record<string, unknown> = Object.create(null)

  for (const record of records) {
    if (!record) continue

    Object.assign(result, record)
  }

  return result
}

function extractContentSegments(path: string): string[] {
  const normalizedPath = path.replaceAll('\\', '/')
  const segments = normalizedPath.split('/').filter(Boolean)
  const docsIndex = segments.lastIndexOf('docs')

  if (docsIndex >= 0 && docsIndex < segments.length - 1) {
    return segments.slice(docsIndex + 1)
  }

  return segments
}

function extractHeadings(entry: RawDocsRecord): readonly DocsHeading[] {
  const data = readRecord(entry, 'data')
  const info = readRecord(entry, 'info')

  const candidates = [
    entry.toc,
    data?.toc,
    info?.toc,
    entry.headings,
    data?.headings,
  ]

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue

    const headings = candidate
      .map(createHeading)
      .filter((heading): heading is DocsHeading => heading !== undefined)

    if (headings.length > 0) {
      return headings
    }
  }

  return []
}

function createHeading(value: unknown): DocsHeading | undefined {
  if (!isRecord(value)) return undefined

  const title =
    readString(value, 'title') ??
    readString(value, 'value') ??
    readString(value, 'text')

  if (!title) return undefined

  const depthValue = value.depth
  const depth =
    typeof depthValue === 'number' && Number.isFinite(depthValue)
      ? depthValue
      : undefined

  return {
    title,
    depth,
    url:
      readString(value, 'url') ??
      readString(value, 'href') ??
      readString(value, 'id'),
  }
}

function getRawEntries(entries: unknown): readonly unknown[] {
  if (Array.isArray(entries)) {
    return entries
  }

  if (isRecord(entries)) {
    return Object.values(entries)
  }

  return []
}

function deduplicatePages(pages: readonly DocsPage[]): DocsPage[] {
  const pageMap = new Map<string, DocsPage>()

  for (const page of pages) {
    const existingPage = pageMap.get(page.url)

    if (!existingPage || compareDocsPages(page, existingPage) < 0) {
      pageMap.set(page.url, page)
    }
  }

  return [...pageMap.values()]
}

function compareDocsPages(left: DocsPage, right: DocsPage): number {
  const audienceComparison = docsCollator.compare(left.audience, right.audience)

  if (audienceComparison !== 0) return audienceComparison

  const parentComparison = docsCollator.compare(
    left.slug.slice(0, -1).join('/'),
    right.slug.slice(0, -1).join('/'),
  )

  if (parentComparison !== 0) return parentComparison

  const orderComparison = left.order - right.order

  if (orderComparison !== 0) return orderComparison

  const titleComparison = docsCollator.compare(left.title, right.title)

  if (titleComparison !== 0) return titleComparison

  return docsCollator.compare(left.url, right.url)
}

function createMutableTreeNode(segment: string): MutableDocsTreeNode {
  return {
    segment,
    children: new Map<string, MutableDocsTreeNode>(),
  }
}

function finalizeTreeChildren(
  node: MutableDocsTreeNode,
): readonly DocsTreeNode[] {
  return [...node.children.values()]
    .sort(compareMutableTreeNodes)
    .map((child) => ({
      segment: child.segment,
      title: child.page?.title ?? humanizeSegment(child.segment),
      url: child.page?.url,
      page: child.page,
      children: finalizeTreeChildren(child),
    }))
}

function compareMutableTreeNodes(
  left: MutableDocsTreeNode,
  right: MutableDocsTreeNode,
): number {
  const leftOrder = getTreeNodeOrder(left)
  const rightOrder = getTreeNodeOrder(right)
  const orderComparison = leftOrder - rightOrder

  if (orderComparison !== 0) return orderComparison

  const leftTitle = left.page?.title ?? humanizeSegment(left.segment)
  const rightTitle = right.page?.title ?? humanizeSegment(right.segment)

  return docsCollator.compare(leftTitle, rightTitle)
}

function getTreeNodeOrder(node: MutableDocsTreeNode): number {
  if (node.page) return node.page.order

  let smallestOrder = Number.POSITIVE_INFINITY

  for (const child of node.children.values()) {
    smallestOrder = Math.min(smallestOrder, getTreeNodeOrder(child))
  }

  return Number.isFinite(smallestOrder) ? smallestOrder : 999
}

function appendTreePages(node: DocsTreeNode, pages: DocsPage[]): void {
  if (node.page) {
    pages.push(node.page)
  }

  for (const child of node.children) {
    appendTreePages(child, pages)
  }
}

function scoreSearchResult(
  page: DocsPage,
  normalizedQuery: string,
  queryTokens: readonly string[],
): DocsSearchResult | undefined {
  const fields = {
    title: normalizeSearchValue(page.title),
    description: normalizeSearchValue(page.description),
    keywords: normalizeSearchValue(page.keywords.join(' ')),
    headings: normalizeSearchValue(
      page.headings.map((heading) => heading.title).join(' '),
    ),
    body: normalizeSearchValue(page.searchText),
    path: normalizeSearchValue(
      `${page.audience} ${page.slug.join(' ')} ${page.filePath}`,
    ),
  } satisfies Record<DocsSearchField, string>

  const matchedFields = new Set<DocsSearchField>()
  let score = 0

  score += scoreField(
    fields.title,
    normalizedQuery,
    queryTokens,
    100,
    matchedFields,
    'title',
  )

  score += scoreField(
    fields.keywords,
    normalizedQuery,
    queryTokens,
    70,
    matchedFields,
    'keywords',
  )

  score += scoreField(
    fields.description,
    normalizedQuery,
    queryTokens,
    45,
    matchedFields,
    'description',
  )

  score += scoreField(
    fields.headings,
    normalizedQuery,
    queryTokens,
    35,
    matchedFields,
    'headings',
  )

  score += scoreField(
    fields.body,
    normalizedQuery,
    queryTokens,
    15,
    matchedFields,
    'body',
  )

  score += scoreField(
    fields.path,
    normalizedQuery,
    queryTokens,
    20,
    matchedFields,
    'path',
  )

  if (score === 0) return undefined

  return {
    page,
    score,
    matchedFields: [...matchedFields],
  }
}

function scoreField(
  fieldValue: string,
  fullQuery: string,
  queryTokens: readonly string[],
  weight: number,
  matchedFields: Set<DocsSearchField>,
  fieldName: DocsSearchField,
): number {
  if (fieldValue.length === 0) return 0

  let score = 0

  if (fieldValue === fullQuery) {
    score += weight * 3
  } else if (fieldValue.startsWith(fullQuery)) {
    score += weight * 2
  } else if (fieldValue.includes(fullQuery)) {
    score += weight
  }

  for (const token of queryTokens) {
    if (fieldValue.includes(token)) {
      score += Math.max(1, Math.round(weight / 4))
    }
  }

  if (score > 0) {
    matchedFields.add(fieldName)
  }

  return score
}

function compareSearchResults(
  left: DocsSearchResult,
  right: DocsSearchResult,
): number {
  const scoreComparison = right.score - left.score

  if (scoreComparison !== 0) return scoreComparison

  const orderComparison = left.page.order - right.page.order

  if (orderComparison !== 0) return orderComparison

  return docsCollator.compare(left.page.title, right.page.title)
}

function normalizeSlugInput(
  slug: string | readonly string[] | undefined,
  audience: DocsAudience,
): readonly string[] | undefined {
  const sourceSegments =
    typeof slug === 'string'
      ? normalizePathSegments(slug)
      : [...(slug ?? [])].map(normalizeContentSegment).filter(Boolean)

  const documentationIndex = sourceSegments.indexOf('documentation')
  let segments =
    documentationIndex >= 0
      ? sourceSegments.slice(documentationIndex + 1)
      : sourceSegments

  if (segments[0] === audience) {
    segments = segments.slice(1)
  }

  if (!isSafeSlug(segments)) return undefined

  return segments
}

function normalizePathSegments(path: string): string[] {
  return path
    .replaceAll('\\', '/')
    .split('/')
    .map(removeQueryString)
    .map(normalizeContentSegment)
    .filter(Boolean)
}

function normalizeContentSegment(segment: string): string {
  return removeMarkdownExtension(decodeSegment(segment)).trim().toLowerCase()
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function removeMarkdownExtension(segment: string): string {
  return segment.replace(/\.(?:md|mdx)$/i, '')
}

function removeQueryString(segment: string): string {
  return segment.split(/[?#]/, 1)[0] ?? ''
}

function isIndexFile(segment: string): boolean {
  return /^index\.(?:md|mdx)$/i.test(segment)
}

function isSafeSlug(slug: readonly string[]): boolean {
  return slug.every(
    (segment) =>
      segment.length > 0 &&
      segment !== '.' &&
      segment !== '..' &&
      !segment.includes('/') &&
      !segment.includes('\\'),
  )
}

function areSegmentsEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((segment, index) => segment === right[index])
  )
}

function isDraftAvailable(page: DocsPage): boolean {
  return defaultIncludeDraft || !page.draft
}

function readOrder(record: RawDocsRecord): number {
  const value = record.order

  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value
  }

  return 999
}

function readString(
  record: RawDocsRecord | undefined,
  key: string,
): string | undefined {
  const value = record?.[key]

  if (typeof value !== 'string') return undefined

  const normalizedValue = value.trim()

  return normalizedValue.length > 0 ? normalizedValue : undefined
}

function readDateValue(record: RawDocsRecord, key: string): string | undefined {
  const value = record[key]

  if (typeof value === 'number' && Number.isInteger(value)) {
    return String(value)
  }

  return readString(record, key)
}

function readBoolean(record: RawDocsRecord, key: string): boolean | undefined {
  const value = record[key]

  return typeof value === 'boolean' ? value : undefined
}

function readStringArray(
  record: RawDocsRecord,
  key: string,
): readonly string[] {
  const value = record[key]

  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function readRecord(
  record: RawDocsRecord | undefined,
  key: string,
): RawDocsRecord | undefined {
  const value = record?.[key]

  return isRecord(value) ? value : undefined
}

function isRecord(value: unknown): value is RawDocsRecord {
  return typeof value === 'object' && value !== null
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFKD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9/_-]+/g, ' ')
    .trim()
}

function normalizeSearchLimit(limit: number | undefined): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0) {
    return 20
  }

  return Math.min(Math.floor(limit), 100)
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
  return word.length === 0
    ? word
    : `${word.charAt(0).toUpperCase()}${word.slice(1)}`
}
