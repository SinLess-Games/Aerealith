// libs/core/src/schemas/entities/user/session.schema.ts

import { z } from 'zod';

import { Country } from '../../../enumns';

/**
 * Internal user session entity ID.
 */
export const UserSessionIdSchema = z.string().uuid();

/**
 * Internal user ID.
 */
export const UserSessionUserIdSchema = z.string().uuid();

/**
 * Hashed session token.
 *
 * Never store or expose a raw session token.
 */
export const UserSessionTokenHashSchema = z.string().trim().min(1).max(1024);

/**
 * User-provided or detected device name.
 */
export const UserSessionDeviceNameSchema = z.string().trim().min(1).max(200);

/**
 * Browser or client user agent.
 */
export const UserSessionUserAgentSchema = z.string().trim().min(1).max(1000);

/**
 * IPv4 or IPv6 address.
 *
 * Kept simple because exact IP validation can get annoying fast.
 */
export const UserSessionIpAddressSchema = z.string().trim().min(1).max(45);

/**
 * Full internal GeoIP data.
 *
 * Latitude and longitude are internal only.
 */
export const UserSessionGeoIpSchema = z.object({
  country: z.enum(Country).optional(),
  region: z.string().trim().min(1).max(200).optional(),
  city: z.string().trim().min(1).max(200).optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

/**
 * Safe GeoIP data for API responses.
 *
 * Does not include latitude or longitude.
 */
export const PublicUserSessionGeoIpSchema = UserSessionGeoIpSchema.omit({
  latitude: true,
  longitude: true,
});

/**
 * Full internal user session entity schema.
 *
 * Includes `tokenHash`, so do not use this schema for API responses.
 */
export const UserSessionEntitySchema = z.object({
  id: UserSessionIdSchema,
  userId: UserSessionUserIdSchema,

  tokenHash: UserSessionTokenHashSchema,

  deviceName: UserSessionDeviceNameSchema.nullable(),
  userAgent: UserSessionUserAgentSchema.nullable(),
  ipAddress: UserSessionIpAddressSchema.nullable(),
  geoIp: UserSessionGeoIpSchema.nullable(),

  lastSeenAt: z.coerce.date().nullable(),
  expiresAt: z.coerce.date(),
  revokedAt: z.coerce.date().nullable(),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

/**
 * Data accepted when creating a user session.
 */
export const CreateUserSessionEntitySchema = z.object({
  userId: UserSessionUserIdSchema,
  tokenHash: UserSessionTokenHashSchema,
  expiresAt: z.coerce.date(),

  deviceName: UserSessionDeviceNameSchema.nullable().optional(),
  userAgent: UserSessionUserAgentSchema.nullable().optional(),
  ipAddress: UserSessionIpAddressSchema.nullable().optional(),
  geoIp: UserSessionGeoIpSchema.nullable().optional(),

  lastSeenAt: z.coerce.date().nullable().optional(),
  revokedAt: z.coerce.date().nullable().optional(),
});

/**
 * Data allowed when updating session activity or revoking a session.
 */
export const UpdateUserSessionEntitySchema = z.object({
  deviceName: UserSessionDeviceNameSchema.nullable().optional(),
  userAgent: UserSessionUserAgentSchema.nullable().optional(),
  ipAddress: UserSessionIpAddressSchema.nullable().optional(),
  geoIp: UserSessionGeoIpSchema.nullable().optional(),

  lastSeenAt: z.coerce.date().nullable().optional(),
  expiresAt: z.coerce.date().optional(),
  revokedAt: z.coerce.date().nullable().optional(),
});

/**
 * Activity update payload.
 */
export const RecordUserSessionActivitySchema = z.object({
  userAgent: UserSessionUserAgentSchema.nullable().optional(),
  ipAddress: UserSessionIpAddressSchema.nullable().optional(),
  geoIp: UserSessionGeoIpSchema.nullable().optional(),
});

/**
 * Session data safe to return to the owning user or an authorized admin.
 *
 * Does not expose `tokenHash` or precise GeoIP coordinates.
 */
export const UserSessionContractSchema = z.object({
  id: UserSessionIdSchema,
  userId: UserSessionUserIdSchema,

  deviceName: UserSessionDeviceNameSchema.nullable(),
  userAgent: UserSessionUserAgentSchema.nullable(),
  ipAddress: UserSessionIpAddressSchema.nullable(),
  geoIp: PublicUserSessionGeoIpSchema.nullable(),

  lastSeenAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserSessionGeoIpInput = z.infer<typeof UserSessionGeoIpSchema>;

export type PublicUserSessionGeoIpInput = z.infer<
  typeof PublicUserSessionGeoIpSchema
>;

export type UserSessionEntitySchemaType = z.infer<
  typeof UserSessionEntitySchema
>;

export type CreateUserSessionEntityInput = z.infer<
  typeof CreateUserSessionEntitySchema
>;

export type UpdateUserSessionEntityInput = z.infer<
  typeof UpdateUserSessionEntitySchema
>;

export type RecordUserSessionActivityInput = z.infer<
  typeof RecordUserSessionActivitySchema
>;

export type UserSessionContractSchemaType = z.infer<
  typeof UserSessionContractSchema
>;