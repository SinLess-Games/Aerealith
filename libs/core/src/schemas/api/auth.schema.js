'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResendVerificationResponseSchema =
  exports.VerifyEmailResponseSchema =
  exports.LogoutResponseSchema =
  exports.RefreshResponseSchema =
  exports.PublicAuthUserResponseSchema =
  exports.AuthUserResponseSchema =
  exports.AuthSessionResponseSchema =
  exports.ResendVerificationRequestSchema =
  exports.VerifyEmailRequestSchema =
  exports.LogoutRequestSchema =
  exports.RefreshRequestSchema =
  exports.LoginRequestSchema =
  exports.SignUpRequestSchema =
  exports.AuthSessionSchema =
  exports.AuthTokensSchema =
  exports.PublicAuthUserSchema =
  exports.AuthUserSchema =
  exports.TokenSchema =
  exports.PasswordSchema =
  exports.EmailSchema =
  exports.UsernameSchema =
    void 0;
const zod_1 = require('zod');
const api_response_schema_1 = require('./api-response.schema');
/**
 * Reusable authentication field schemas.
 */
exports.UsernameSchema = zod_1.z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9_]+$/);
exports.EmailSchema = zod_1.z
  .string()
  .trim()
  .toLowerCase()
  .pipe(zod_1.z.email());
exports.PasswordSchema = zod_1.z.string().min(8).max(128);
exports.TokenSchema = zod_1.z.string().min(1);
/**
 * Authenticated user returned by auth endpoints.
 */
exports.AuthUserSchema = zod_1.z.object({
  id: zod_1.z.uuid(),
  username: exports.UsernameSchema,
  email: exports.EmailSchema,
  emailVerified: zod_1.z.boolean(),
  displayName: zod_1.z.string().nullable().optional(),
  createdAt: zod_1.z.iso.datetime(),
  updatedAt: zod_1.z.iso.datetime(),
});
/**
 * Public user information safe to return from public auth/profile routes.
 */
exports.PublicAuthUserSchema = zod_1.z.object({
  id: zod_1.z.uuid(),
  username: exports.UsernameSchema,
  displayName: zod_1.z.string().nullable().optional(),
});
/**
 * Access and refresh token payload.
 */
exports.AuthTokensSchema = zod_1.z.object({
  accessToken: exports.TokenSchema,
  refreshToken: exports.TokenSchema,
  expiresIn: zod_1.z.number().int().positive(),
  tokenType: zod_1.z.literal('Bearer'),
});
/**
 * Authenticated session payload.
 */
exports.AuthSessionSchema = zod_1.z.object({
  user: exports.AuthUserSchema,
  tokens: exports.AuthTokensSchema,
});
/**
 * Sign-up request payload.
 */
exports.SignUpRequestSchema = zod_1.z.object({
  username: exports.UsernameSchema,
  email: exports.EmailSchema,
  password: exports.PasswordSchema,
  displayName: zod_1.z.string().trim().min(1).max(100).nullable().optional(),
});
/**
 * Login request payload.
 */
exports.LoginRequestSchema = zod_1.z.object({
  usernameOrEmail: zod_1.z.string().trim().min(1),
  password: exports.PasswordSchema,
});
/**
 * Refresh-token request payload.
 */
exports.RefreshRequestSchema = zod_1.z.object({
  refreshToken: exports.TokenSchema,
});
/**
 * Logout request payload.
 */
exports.LogoutRequestSchema = zod_1.z.object({
  refreshToken: exports.TokenSchema.optional(),
});
/**
 * Email verification request payload.
 */
exports.VerifyEmailRequestSchema = zod_1.z.object({
  token: exports.TokenSchema,
});
/**
 * Request a new email verification message.
 */
exports.ResendVerificationRequestSchema = zod_1.z.object({
  email: exports.EmailSchema,
});
/**
 * Auth API response schemas.
 */
exports.AuthSessionResponseSchema = (0,
api_response_schema_1.apiResponseSchema)(
  exports.AuthSessionSchema,
  api_response_schema_1.ApiErrorCodeSchema,
);
exports.AuthUserResponseSchema = (0, api_response_schema_1.apiResponseSchema)(
  exports.AuthUserSchema,
  api_response_schema_1.ApiErrorCodeSchema,
);
exports.PublicAuthUserResponseSchema = (0,
api_response_schema_1.apiResponseSchema)(
  exports.PublicAuthUserSchema,
  api_response_schema_1.ApiErrorCodeSchema,
);
exports.RefreshResponseSchema = (0, api_response_schema_1.apiResponseSchema)(
  exports.AuthTokensSchema,
  api_response_schema_1.ApiErrorCodeSchema,
);
exports.LogoutResponseSchema = (0, api_response_schema_1.apiResponseSchema)(
  zod_1.z.null(),
  api_response_schema_1.ApiErrorCodeSchema,
);
exports.VerifyEmailResponseSchema = (0,
api_response_schema_1.apiResponseSchema)(
  zod_1.z.object({
    emailVerified: zod_1.z.literal(true),
  }),
  api_response_schema_1.ApiErrorCodeSchema,
);
exports.ResendVerificationResponseSchema = (0,
api_response_schema_1.apiResponseSchema)(
  zod_1.z.object({
    sent: zod_1.z.literal(true),
  }),
  api_response_schema_1.ApiErrorCodeSchema,
);
//# sourceMappingURL=auth.schema.js.map
