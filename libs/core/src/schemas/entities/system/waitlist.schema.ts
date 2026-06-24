import { z } from 'zod'

/**
 * Internal waitlist entry ID.
 */
export const WaitlistIdSchema = z.uuid()

/**
 * Waitlist email addresses are stored lowercase.
 */
export const WaitlistEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email())

/**
 * Full internal waitlist entity schema.
 *
 * Do not use this schema for public API responses because email addresses
 * are private user data.
 */
export const WaitlistEntitySchema = z.object({
  id: WaitlistIdSchema,
  email: WaitlistEmailSchema,

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

/**
 * Data accepted when adding an email address to the waitlist.
 */
export const CreateWaitlistEntitySchema = z.object({
  email: WaitlistEmailSchema,
})

/**
 * Safe waitlist response for an authorized internal/admin API.
 */
export const WaitlistContractSchema = z.object({
  id: WaitlistIdSchema,
  email: WaitlistEmailSchema,
  createdAt: z.iso.datetime(),
})

export type WaitlistEntitySchemaType = z.infer<typeof WaitlistEntitySchema>

export type CreateWaitlistEntityInput = z.infer<
  typeof CreateWaitlistEntitySchema
>

export type WaitlistContractSchemaType = z.infer<typeof WaitlistContractSchema>
