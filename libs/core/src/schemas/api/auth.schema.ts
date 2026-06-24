import { z } from 'zod'

import { ApiErrorCodeSchema, apiResponseSchema } from './api-response.schema'

/**
 * Reusable authentication field schemas.
 */
export const UsernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9_]+$/)

export const EmailSchema = z.string().trim().toLowerCase().pipe(z.email())

export const PasswordSchema = z.string().min(8).max(128)

export const TokenSchema = z.string().min(1)

/**
 * Authenticated user returned by auth endpoints.
 */
export const AuthUserSchema = z.object({
  id: z.uuid(),
  username: UsernameSchema,
  email: EmailSchema,
  emailVerified: z.boolean(),
  displayName: z.string().nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

/**
 * Public user information safe to return from public auth/profile routes.
 */
export const PublicAuthUserSchema = z.object({
  id: z.uuid(),
  username: UsernameSchema,
  displayName: z.string().nullable().optional(),
})

/**
 * Access and refresh token payload.
 */
export const AuthTokensSchema = z.object({
  accessToken: TokenSchema,
  refreshToken: TokenSchema,
  expiresIn: z.number().int().positive(),
  tokenType: z.literal('Bearer'),
})

/**
 * Authenticated session payload.
 */
export const AuthSessionSchema = z.object({
  user: AuthUserSchema,
  tokens: AuthTokensSchema,
})

/**
 * Sign-up request payload.
 */
export const SignUpRequestSchema = z.object({
  username: UsernameSchema,
  email: EmailSchema,
  password: PasswordSchema,
  displayName: z.string().trim().min(1).max(100).nullable().optional(),
})

/**
 * Login request payload.
 */
export const LoginRequestSchema = z.object({
  usernameOrEmail: z.string().trim().min(1),
  password: PasswordSchema,
})

/**
 * Refresh-token request payload.
 */
export const RefreshRequestSchema = z.object({
  refreshToken: TokenSchema,
})

/**
 * Logout request payload.
 */
export const LogoutRequestSchema = z.object({
  refreshToken: TokenSchema.optional(),
})

/**
 * Email verification request payload.
 */
export const VerifyEmailRequestSchema = z.object({
  token: TokenSchema,
})

/**
 * Request a new email verification message.
 */
export const ResendVerificationRequestSchema = z.object({
  email: EmailSchema,
})

/**
 * Auth API response schemas.
 */
export const AuthSessionResponseSchema = apiResponseSchema(
  AuthSessionSchema,
  ApiErrorCodeSchema,
)

export const AuthUserResponseSchema = apiResponseSchema(
  AuthUserSchema,
  ApiErrorCodeSchema,
)

export const PublicAuthUserResponseSchema = apiResponseSchema(
  PublicAuthUserSchema,
  ApiErrorCodeSchema,
)

export const RefreshResponseSchema = apiResponseSchema(
  AuthTokensSchema,
  ApiErrorCodeSchema,
)

export const LogoutResponseSchema = apiResponseSchema(
  z.null(),
  ApiErrorCodeSchema,
)

export const VerifyEmailResponseSchema = apiResponseSchema(
  z.object({
    emailVerified: z.literal(true),
  }),
  ApiErrorCodeSchema,
)

export const ResendVerificationResponseSchema = apiResponseSchema(
  z.object({
    sent: z.literal(true),
  }),
  ApiErrorCodeSchema,
)

/**
 * Inferred request payload types.
 */
export type SignUpRequestInput = z.infer<typeof SignUpRequestSchema>

export type LoginRequestInput = z.infer<typeof LoginRequestSchema>

export type RefreshRequestInput = z.infer<typeof RefreshRequestSchema>

export type LogoutRequestInput = z.infer<typeof LogoutRequestSchema>

export type VerifyEmailRequestInput = z.infer<typeof VerifyEmailRequestSchema>

export type ResendVerificationRequestInput = z.infer<
  typeof ResendVerificationRequestSchema
>
