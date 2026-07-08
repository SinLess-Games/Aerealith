import { z } from 'zod';
/**
 * Internal waitlist entry ID.
 */
export declare const WaitlistIdSchema: z.ZodUUID;
/**
 * Waitlist email addresses are stored lowercase.
 */
export declare const WaitlistEmailSchema: z.ZodPipe<z.ZodString, z.ZodEmail>;
/**
 * Full internal waitlist entity schema.
 *
 * Do not use this schema for public API responses because email addresses
 * are private user data.
 */
export declare const WaitlistEntitySchema: z.ZodObject<
  {
    id: z.ZodUUID;
    email: z.ZodPipe<z.ZodString, z.ZodEmail>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
    deletedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
  },
  z.core.$strip
>;
/**
 * Data accepted when adding an email address to the waitlist.
 */
export declare const CreateWaitlistEntitySchema: z.ZodObject<
  {
    email: z.ZodPipe<z.ZodString, z.ZodEmail>;
  },
  z.core.$strip
>;
/**
 * Safe waitlist response for an authorized internal/admin API.
 */
export declare const WaitlistContractSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    email: z.ZodPipe<z.ZodString, z.ZodEmail>;
    createdAt: z.ZodISODateTime;
  },
  z.core.$strip
>;
export type WaitlistEntitySchemaType = z.infer<typeof WaitlistEntitySchema>;
export type CreateWaitlistEntityInput = z.infer<
  typeof CreateWaitlistEntitySchema
>;
export type WaitlistContractSchemaType = z.infer<typeof WaitlistContractSchema>;
