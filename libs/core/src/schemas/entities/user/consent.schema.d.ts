import { z } from 'zod';
/**
 * Internal user consent record ID.
 */
export declare const UserConsentIdSchema: z.ZodUUID;
/**
 * Policy, terms, or preference version.
 *
 * Example: 2026-06-19
 */
export declare const UserConsentVersionSchema: z.ZodString;
/**
 * Supported user consent categories.
 */
export declare const UserConsentTypeSchema: z.ZodEnum<{
  readonly TermsOfService: 'terms_of_service';
  readonly PrivacyPolicy: 'privacy_policy';
  readonly MarketingEmails: 'marketing_emails';
  readonly ProductUpdates: 'product_updates';
  readonly Analytics: 'analytics';
  readonly Cookies: 'cookies';
}>;
/**
 * Full internal user consent entity schema.
 */
export declare const UserConsentEntitySchema: z.ZodObject<
  {
    id: z.ZodUUID;
    userId: z.ZodUUID;
    type: z.ZodEnum<{
      readonly TermsOfService: 'terms_of_service';
      readonly PrivacyPolicy: 'privacy_policy';
      readonly MarketingEmails: 'marketing_emails';
      readonly ProductUpdates: 'product_updates';
      readonly Analytics: 'analytics';
      readonly Cookies: 'cookies';
    }>;
    version: z.ZodNullable<z.ZodString>;
    grantedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    revokedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
    deletedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
  },
  z.core.$strip
>;
/**
 * Data accepted when creating a user consent record.
 *
 * A newly created consent record is normally granted immediately.
 */
export declare const CreateUserConsentEntitySchema: z.ZodObject<
  {
    userId: z.ZodUUID;
    type: z.ZodEnum<{
      readonly TermsOfService: 'terms_of_service';
      readonly PrivacyPolicy: 'privacy_policy';
      readonly MarketingEmails: 'marketing_emails';
      readonly ProductUpdates: 'product_updates';
      readonly Analytics: 'analytics';
      readonly Cookies: 'cookies';
    }>;
    version: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    grantedAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
    revokedAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
  },
  z.core.$strip
>;
/**
 * Data accepted when granting or revoking an existing consent record.
 */
export declare const UpdateUserConsentEntitySchema: z.ZodObject<
  {
    version: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    granted: z.ZodBoolean;
  },
  z.core.$strip
>;
/**
 * API-safe user consent response.
 */
export declare const UserConsentContractSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    userId: z.ZodUUID;
    type: z.ZodEnum<{
      readonly TermsOfService: 'terms_of_service';
      readonly PrivacyPolicy: 'privacy_policy';
      readonly MarketingEmails: 'marketing_emails';
      readonly ProductUpdates: 'product_updates';
      readonly Analytics: 'analytics';
      readonly Cookies: 'cookies';
    }>;
    version: z.ZodNullable<z.ZodString>;
    grantedAt: z.ZodNullable<z.ZodISODateTime>;
    revokedAt: z.ZodNullable<z.ZodISODateTime>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
  },
  z.core.$strip
>;
/**
 * API request for granting or revoking consent.
 */
export declare const UpdateUserConsentContractSchema: z.ZodObject<
  {
    type: z.ZodEnum<{
      readonly TermsOfService: 'terms_of_service';
      readonly PrivacyPolicy: 'privacy_policy';
      readonly MarketingEmails: 'marketing_emails';
      readonly ProductUpdates: 'product_updates';
      readonly Analytics: 'analytics';
      readonly Cookies: 'cookies';
    }>;
    version: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    granted: z.ZodBoolean;
  },
  z.core.$strip
>;
export type UserConsentEntitySchemaType = z.infer<
  typeof UserConsentEntitySchema
>;
export type CreateUserConsentEntityInput = z.infer<
  typeof CreateUserConsentEntitySchema
>;
export type UpdateUserConsentEntityInput = z.infer<
  typeof UpdateUserConsentEntitySchema
>;
export type UserConsentContractSchemaType = z.infer<
  typeof UserConsentContractSchema
>;
export type UpdateUserConsentContractInput = z.infer<
  typeof UpdateUserConsentContractSchema
>;
