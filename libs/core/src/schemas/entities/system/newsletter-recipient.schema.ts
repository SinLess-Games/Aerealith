import { z } from 'zod';

import { WaitlistEmailSchema } from './waitlist.schema';

export const NewsletterRecipientIdSchema = z.uuid();

export const NewsletterRecipientSourceSchema = z
  .string()
  .trim()
  .min(1)
  .max(100);

export const NewsletterRecipientEntitySchema = z.object({
  id: NewsletterRecipientIdSchema,
  email: WaitlistEmailSchema,
  source: NewsletterRecipientSourceSchema,
  subscribedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export const CreateNewsletterRecipientEntitySchema = z.object({
  email: WaitlistEmailSchema,
  source: NewsletterRecipientSourceSchema.optional(),
});

export const NewsletterRecipientContractSchema = z.object({
  id: NewsletterRecipientIdSchema,
  email: WaitlistEmailSchema,
  source: NewsletterRecipientSourceSchema,
  subscribedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});

export type NewsletterRecipientEntitySchemaType = z.infer<
  typeof NewsletterRecipientEntitySchema
>;

export type CreateNewsletterRecipientEntityInput = z.infer<
  typeof CreateNewsletterRecipientEntitySchema
>;
