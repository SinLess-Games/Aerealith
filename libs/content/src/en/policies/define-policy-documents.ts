import type {
  PolicyContact,
  PolicyDocument,
  PolicyHref,
  PolicyLink,
  PolicyMeta,
  PolicySection,
  PolicyStatus,
} from '../../types'

const POLICY_STATUSES: ReadonlySet<string> = new Set<PolicyStatus>([
  'draft',
  'review',
  'approved',
  'published',
  'archived',
])
const POLICY_DOCUMENT_KEYS: ReadonlySet<string> = new Set([
  'slug',
  'path',
  'meta',
  'relatedPolicies',
  'sections',
])
const POLICY_META_KEYS: ReadonlySet<string> = new Set([
  'title',
  'description',
  'effectiveDate',
  'lastUpdated',
  'owner',
  'status',
])
const POLICY_SECTION_KEYS: ReadonlySet<string> = new Set([
  'id',
  'title',
  'body',
  'bullets',
  'orderedItems',
  'links',
  'contacts',
  'note',
])
const POLICY_LINK_KEYS: ReadonlySet<string> = new Set([
  'label',
  'href',
  'description',
])
const POLICY_CONTACT_KEYS: ReadonlySet<string> = new Set([
  'label',
  'email',
  'href',
])
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOnlyKeys(
  value: Readonly<Record<string, unknown>>,
  allowedKeys: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowedKeys.has(key))
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isIsoDate(value: unknown): value is string {
  if (!isNonEmptyString(value) || !ISO_DATE_PATTERN.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value)
}

function isEmail(value: unknown): value is string {
  return isNonEmptyString(value) && EMAIL_PATTERN.test(value)
}

function isPolicyHref(value: unknown): value is PolicyHref {
  if (!isNonEmptyString(value)) {
    return false
  }

  if (value.startsWith('mailto:')) {
    return isEmail(value.slice('mailto:'.length))
  }

  return (
    value.startsWith('/') ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('https://') ||
    value.startsWith('http://')
  )
}

function isPolicyStatus(value: unknown): value is PolicyStatus {
  return typeof value === 'string' && POLICY_STATUSES.has(value)
}

function isArrayOf<T>(
  value: unknown,
  predicate: (entry: unknown) => entry is T,
): value is T[] {
  return Array.isArray(value) && value.every((entry) => predicate(entry))
}

function isOptionalArrayOf<T>(
  value: unknown,
  predicate: (entry: unknown) => entry is T,
): value is T[] | undefined {
  return value === undefined || isArrayOf(value, predicate)
}

function isPolicyLink(value: unknown): value is PolicyLink {
  if (!isRecord(value) || !hasOnlyKeys(value, POLICY_LINK_KEYS)) {
    return false
  }

  return (
    isNonEmptyString(value['label']) &&
    isPolicyHref(value['href']) &&
    (value['description'] === undefined ||
      isNonEmptyString(value['description']))
  )
}

function isPolicyContact(value: unknown): value is PolicyContact {
  if (!isRecord(value) || !hasOnlyKeys(value, POLICY_CONTACT_KEYS)) {
    return false
  }

  const email = value['email']
  const href = value['href']

  return (
    isNonEmptyString(value['label']) &&
    isEmail(email) &&
    (href === undefined || href === `mailto:${email}`)
  )
}

function isPolicyMeta(value: unknown): value is PolicyMeta {
  if (!isRecord(value) || !hasOnlyKeys(value, POLICY_META_KEYS)) {
    return false
  }

  return (
    isNonEmptyString(value['title']) &&
    isNonEmptyString(value['description']) &&
    isIsoDate(value['effectiveDate']) &&
    isIsoDate(value['lastUpdated']) &&
    isNonEmptyString(value['owner']) &&
    isPolicyStatus(value['status'])
  )
}

function isPolicySection(value: unknown): value is PolicySection {
  if (!isRecord(value) || !hasOnlyKeys(value, POLICY_SECTION_KEYS)) {
    return false
  }

  return (
    isNonEmptyString(value['id']) &&
    isNonEmptyString(value['title']) &&
    isOptionalArrayOf(value['body'], isNonEmptyString) &&
    isOptionalArrayOf(value['bullets'], isNonEmptyString) &&
    isOptionalArrayOf(value['orderedItems'], isNonEmptyString) &&
    isOptionalArrayOf(value['links'], isPolicyLink) &&
    isOptionalArrayOf(value['contacts'], isPolicyContact) &&
    (value['note'] === undefined || isNonEmptyString(value['note']))
  )
}

function hasUniqueSectionIds(sections: readonly PolicySection[]): boolean {
  return new Set(sections.map((section) => section.id)).size === sections.length
}

function isPolicyDocument(value: unknown): value is PolicyDocument {
  if (!isRecord(value) || !hasOnlyKeys(value, POLICY_DOCUMENT_KEYS)) {
    return false
  }

  const sections = value['sections']
  if (
    !isArrayOf(sections, isPolicySection) ||
    sections.length === 0 ||
    !hasUniqueSectionIds(sections)
  ) {
    return false
  }

  return (
    isNonEmptyString(value['slug']) &&
    SLUG_PATTERN.test(value['slug']) &&
    isPolicyHref(value['path']) &&
    isPolicyMeta(value['meta']) &&
    isOptionalArrayOf(value['relatedPolicies'], isPolicyLink)
  )
}

function assertPolicyDocument(
  value: unknown,
  exportName: string,
): asserts value is PolicyDocument {
  if (!isPolicyDocument(value)) {
    throw new TypeError(`Invalid policy document: ${exportName}`)
  }
}

type ValidatedPolicyDocuments<
  TDocuments extends Readonly<Record<string, unknown>>,
> = {
  readonly [TExportName in keyof TDocuments]: PolicyDocument
}

export function definePolicyDocuments<
  const TDocuments extends Readonly<Record<string, unknown>>,
>(documents: TDocuments): ValidatedPolicyDocuments<TDocuments> {
  for (const [exportName, document] of Object.entries(documents)) {
    assertPolicyDocument(document, exportName)
  }

  return documents as ValidatedPolicyDocuments<TDocuments>
}
