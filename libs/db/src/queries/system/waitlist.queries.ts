// libs/db/src/queries/system/waitlist.queries.ts

import { and, eq, isNull } from 'drizzle-orm'

import { waitlistTable } from '../../schema'

/**
 * Builds a query condition for an active waitlist entry by email address.
 *
 * Soft-deleted entries are excluded.
 */
export function activeWaitlistEntryByEmail(email: string) {
  return and(
    eq(waitlistTable.email, normalizeEmail(email)),
    isNull(waitlistTable.deletedAt),
  )
}

/**
 * Builds a query condition for every waitlist entry using an email address,
 * including soft-deleted records.
 */
export function waitlistEntryByEmail(email: string) {
  return eq(waitlistTable.email, normalizeEmail(email))
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
