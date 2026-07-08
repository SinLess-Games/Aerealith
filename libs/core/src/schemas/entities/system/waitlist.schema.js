'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.WaitlistContractSchema =
  exports.CreateWaitlistEntitySchema =
  exports.WaitlistEntitySchema =
  exports.WaitlistEmailSchema =
  exports.WaitlistIdSchema =
    void 0;
const zod_1 = require('zod');
/**
 * Internal waitlist entry ID.
 */
exports.WaitlistIdSchema = zod_1.z.uuid();
/**
 * Waitlist email addresses are stored lowercase.
 */
exports.WaitlistEmailSchema = zod_1.z
  .string()
  .trim()
  .toLowerCase()
  .pipe(zod_1.z.email());
/**
 * Full internal waitlist entity schema.
 *
 * Do not use this schema for public API responses because email addresses
 * are private user data.
 */
exports.WaitlistEntitySchema = zod_1.z.object({
  id: exports.WaitlistIdSchema,
  email: exports.WaitlistEmailSchema,
  createdAt: zod_1.z.coerce.date(),
  updatedAt: zod_1.z.coerce.date(),
  deletedAt: zod_1.z.coerce.date().nullable(),
});
/**
 * Data accepted when adding an email address to the waitlist.
 */
exports.CreateWaitlistEntitySchema = zod_1.z.object({
  email: exports.WaitlistEmailSchema,
});
/**
 * Safe waitlist response for an authorized internal/admin API.
 */
exports.WaitlistContractSchema = zod_1.z.object({
  id: exports.WaitlistIdSchema,
  email: exports.WaitlistEmailSchema,
  createdAt: zod_1.z.iso.datetime(),
});
//# sourceMappingURL=waitlist.schema.js.map
