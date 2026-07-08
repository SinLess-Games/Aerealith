'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserSessionContractSchema =
  exports.RecordUserSessionActivitySchema =
  exports.UpdateUserSessionEntitySchema =
  exports.CreateUserSessionEntitySchema =
  exports.UserSessionEntitySchema =
  exports.PublicUserSessionGeoIpSchema =
  exports.UserSessionGeoIpSchema =
  exports.UserSessionIpAddressSchema =
  exports.UserSessionUserAgentSchema =
  exports.UserSessionDeviceNameSchema =
  exports.UserSessionTokenHashSchema =
  exports.UserSessionUserIdSchema =
  exports.UserSessionIdSchema =
    void 0;
const zod_1 = require('zod');
const enumns_1 = require('../../../enumns');
/**
 * Internal user session entity ID.
 */
exports.UserSessionIdSchema = zod_1.z.uuid();
/**
 * Internal user ID.
 */
exports.UserSessionUserIdSchema = zod_1.z.uuid();
/**
 * Hashed session token.
 *
 * Never store or expose a raw session token.
 */
exports.UserSessionTokenHashSchema = zod_1.z.string().trim().min(1).max(1024);
/**
 * User-provided or detected device name.
 */
exports.UserSessionDeviceNameSchema = zod_1.z.string().trim().min(1).max(200);
/**
 * Browser or client user agent.
 */
exports.UserSessionUserAgentSchema = zod_1.z.string().trim().min(1).max(1000);
/**
 * IPv4 or IPv6 address.
 *
 * Kept simple because exact IP validation can get annoying fast.
 */
exports.UserSessionIpAddressSchema = zod_1.z.string().trim().min(1).max(45);
/**
 * Full internal GeoIP data.
 *
 * Latitude and longitude are internal only.
 */
exports.UserSessionGeoIpSchema = zod_1.z.object({
  country: zod_1.z.enum(enumns_1.Country).optional(),
  region: zod_1.z.string().trim().min(1).max(200).optional(),
  city: zod_1.z.string().trim().min(1).max(200).optional(),
  timezone: zod_1.z.string().trim().min(1).max(100).optional(),
  latitude: zod_1.z.number().min(-90).max(90).optional(),
  longitude: zod_1.z.number().min(-180).max(180).optional(),
});
/**
 * Safe GeoIP data for API responses.
 *
 * Does not include latitude or longitude.
 */
exports.PublicUserSessionGeoIpSchema = exports.UserSessionGeoIpSchema.omit({
  latitude: true,
  longitude: true,
});
/**
 * Full internal user session entity schema.
 *
 * Includes `tokenHash`, so do not use this schema for API responses.
 */
exports.UserSessionEntitySchema = zod_1.z.object({
  id: exports.UserSessionIdSchema,
  userId: exports.UserSessionUserIdSchema,
  tokenHash: exports.UserSessionTokenHashSchema,
  deviceName: exports.UserSessionDeviceNameSchema.nullable(),
  userAgent: exports.UserSessionUserAgentSchema.nullable(),
  ipAddress: exports.UserSessionIpAddressSchema.nullable(),
  geoIp: exports.UserSessionGeoIpSchema.nullable(),
  lastSeenAt: zod_1.z.coerce.date().nullable(),
  expiresAt: zod_1.z.coerce.date(),
  revokedAt: zod_1.z.coerce.date().nullable(),
  createdAt: zod_1.z.coerce.date(),
  updatedAt: zod_1.z.coerce.date(),
  deletedAt: zod_1.z.coerce.date().nullable(),
});
/**
 * Data accepted when creating a user session.
 */
exports.CreateUserSessionEntitySchema = zod_1.z.object({
  userId: exports.UserSessionUserIdSchema,
  tokenHash: exports.UserSessionTokenHashSchema,
  expiresAt: zod_1.z.coerce.date(),
  deviceName: exports.UserSessionDeviceNameSchema.nullable().optional(),
  userAgent: exports.UserSessionUserAgentSchema.nullable().optional(),
  ipAddress: exports.UserSessionIpAddressSchema.nullable().optional(),
  geoIp: exports.UserSessionGeoIpSchema.nullable().optional(),
  lastSeenAt: zod_1.z.coerce.date().nullable().optional(),
  revokedAt: zod_1.z.coerce.date().nullable().optional(),
});
/**
 * Data allowed when updating session activity or revoking a session.
 */
exports.UpdateUserSessionEntitySchema = zod_1.z.object({
  deviceName: exports.UserSessionDeviceNameSchema.nullable().optional(),
  userAgent: exports.UserSessionUserAgentSchema.nullable().optional(),
  ipAddress: exports.UserSessionIpAddressSchema.nullable().optional(),
  geoIp: exports.UserSessionGeoIpSchema.nullable().optional(),
  lastSeenAt: zod_1.z.coerce.date().nullable().optional(),
  expiresAt: zod_1.z.coerce.date().optional(),
  revokedAt: zod_1.z.coerce.date().nullable().optional(),
});
/**
 * Activity update payload.
 */
exports.RecordUserSessionActivitySchema = zod_1.z.object({
  userAgent: exports.UserSessionUserAgentSchema.nullable().optional(),
  ipAddress: exports.UserSessionIpAddressSchema.nullable().optional(),
  geoIp: exports.UserSessionGeoIpSchema.nullable().optional(),
});
/**
 * Session data safe to return to the owning user or an authorized admin.
 *
 * Does not expose `tokenHash` or precise GeoIP coordinates.
 */
exports.UserSessionContractSchema = zod_1.z.object({
  id: exports.UserSessionIdSchema,
  userId: exports.UserSessionUserIdSchema,
  deviceName: exports.UserSessionDeviceNameSchema.nullable(),
  userAgent: exports.UserSessionUserAgentSchema.nullable(),
  ipAddress: exports.UserSessionIpAddressSchema.nullable(),
  geoIp: exports.PublicUserSessionGeoIpSchema.nullable(),
  lastSeenAt: zod_1.z.iso.datetime().nullable(),
  expiresAt: zod_1.z.iso.datetime(),
  revokedAt: zod_1.z.iso.datetime().nullable(),
  createdAt: zod_1.z.iso.datetime(),
  updatedAt: zod_1.z.iso.datetime(),
});
//# sourceMappingURL=session.schema.js.map
