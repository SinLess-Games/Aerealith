import { z } from 'zod';
/**
 * Reusable authentication field schemas.
 */
export declare const UsernameSchema: z.ZodString;
export declare const EmailSchema: z.ZodPipe<z.ZodString, z.ZodEmail>;
export declare const PasswordSchema: z.ZodString;
export declare const TokenSchema: z.ZodString;
/**
 * Authenticated user returned by auth endpoints.
 */
export declare const AuthUserSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    username: z.ZodString;
    email: z.ZodPipe<z.ZodString, z.ZodEmail>;
    emailVerified: z.ZodBoolean;
    displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
  },
  z.core.$strip
>;
/**
 * Public user information safe to return from public auth/profile routes.
 */
export declare const PublicAuthUserSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    username: z.ZodString;
    displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
  },
  z.core.$strip
>;
/**
 * Access and refresh token payload.
 */
export declare const AuthTokensSchema: z.ZodObject<
  {
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    expiresIn: z.ZodNumber;
    tokenType: z.ZodLiteral<'Bearer'>;
  },
  z.core.$strip
>;
/**
 * Authenticated session payload.
 */
export declare const AuthSessionSchema: z.ZodObject<
  {
    user: z.ZodObject<
      {
        id: z.ZodUUID;
        username: z.ZodString;
        email: z.ZodPipe<z.ZodString, z.ZodEmail>;
        emailVerified: z.ZodBoolean;
        displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodISODateTime;
        updatedAt: z.ZodISODateTime;
      },
      z.core.$strip
    >;
    tokens: z.ZodObject<
      {
        accessToken: z.ZodString;
        refreshToken: z.ZodString;
        expiresIn: z.ZodNumber;
        tokenType: z.ZodLiteral<'Bearer'>;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
/**
 * Sign-up request payload.
 */
export declare const SignUpRequestSchema: z.ZodObject<
  {
    username: z.ZodString;
    email: z.ZodPipe<z.ZodString, z.ZodEmail>;
    password: z.ZodString;
    displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
  },
  z.core.$strip
>;
/**
 * Login request payload.
 */
export declare const LoginRequestSchema: z.ZodObject<
  {
    usernameOrEmail: z.ZodString;
    password: z.ZodString;
  },
  z.core.$strip
>;
/**
 * Refresh-token request payload.
 */
export declare const RefreshRequestSchema: z.ZodObject<
  {
    refreshToken: z.ZodString;
  },
  z.core.$strip
>;
/**
 * Logout request payload.
 */
export declare const LogoutRequestSchema: z.ZodObject<
  {
    refreshToken: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
>;
/**
 * Email verification request payload.
 */
export declare const VerifyEmailRequestSchema: z.ZodObject<
  {
    token: z.ZodString;
  },
  z.core.$strip
>;
/**
 * Request a new email verification message.
 */
export declare const ResendVerificationRequestSchema: z.ZodObject<
  {
    email: z.ZodPipe<z.ZodString, z.ZodEmail>;
  },
  z.core.$strip
>;
/**
 * Auth API response schemas.
 */
export declare const AuthSessionResponseSchema: z.ZodDiscriminatedUnion<
  [
    z.ZodObject<
      {
        ok: z.ZodLiteral<true>;
        data: z.ZodObject<
          {
            user: z.ZodObject<
              {
                id: z.ZodUUID;
                username: z.ZodString;
                email: z.ZodPipe<z.ZodString, z.ZodEmail>;
                emailVerified: z.ZodBoolean;
                displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                createdAt: z.ZodISODateTime;
                updatedAt: z.ZodISODateTime;
              },
              z.core.$strip
            >;
            tokens: z.ZodObject<
              {
                accessToken: z.ZodString;
                refreshToken: z.ZodString;
                expiresIn: z.ZodNumber;
                tokenType: z.ZodLiteral<'Bearer'>;
              },
              z.core.$strip
            >;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        ok: z.ZodLiteral<false>;
        error: z.ZodObject<
          {
            code: z.ZodString;
            message: z.ZodString;
            details: z.ZodOptional<z.ZodUnknown>;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
  ],
  'ok'
>;
export declare const AuthUserResponseSchema: z.ZodDiscriminatedUnion<
  [
    z.ZodObject<
      {
        ok: z.ZodLiteral<true>;
        data: z.ZodObject<
          {
            id: z.ZodUUID;
            username: z.ZodString;
            email: z.ZodPipe<z.ZodString, z.ZodEmail>;
            emailVerified: z.ZodBoolean;
            displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            createdAt: z.ZodISODateTime;
            updatedAt: z.ZodISODateTime;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        ok: z.ZodLiteral<false>;
        error: z.ZodObject<
          {
            code: z.ZodString;
            message: z.ZodString;
            details: z.ZodOptional<z.ZodUnknown>;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
  ],
  'ok'
>;
export declare const PublicAuthUserResponseSchema: z.ZodDiscriminatedUnion<
  [
    z.ZodObject<
      {
        ok: z.ZodLiteral<true>;
        data: z.ZodObject<
          {
            id: z.ZodUUID;
            username: z.ZodString;
            displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        ok: z.ZodLiteral<false>;
        error: z.ZodObject<
          {
            code: z.ZodString;
            message: z.ZodString;
            details: z.ZodOptional<z.ZodUnknown>;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
  ],
  'ok'
>;
export declare const RefreshResponseSchema: z.ZodDiscriminatedUnion<
  [
    z.ZodObject<
      {
        ok: z.ZodLiteral<true>;
        data: z.ZodObject<
          {
            accessToken: z.ZodString;
            refreshToken: z.ZodString;
            expiresIn: z.ZodNumber;
            tokenType: z.ZodLiteral<'Bearer'>;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        ok: z.ZodLiteral<false>;
        error: z.ZodObject<
          {
            code: z.ZodString;
            message: z.ZodString;
            details: z.ZodOptional<z.ZodUnknown>;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
  ],
  'ok'
>;
export declare const LogoutResponseSchema: z.ZodDiscriminatedUnion<
  [
    z.ZodObject<
      {
        ok: z.ZodLiteral<true>;
        data: z.ZodNull;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        ok: z.ZodLiteral<false>;
        error: z.ZodObject<
          {
            code: z.ZodString;
            message: z.ZodString;
            details: z.ZodOptional<z.ZodUnknown>;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
  ],
  'ok'
>;
export declare const VerifyEmailResponseSchema: z.ZodDiscriminatedUnion<
  [
    z.ZodObject<
      {
        ok: z.ZodLiteral<true>;
        data: z.ZodObject<
          {
            emailVerified: z.ZodLiteral<true>;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        ok: z.ZodLiteral<false>;
        error: z.ZodObject<
          {
            code: z.ZodString;
            message: z.ZodString;
            details: z.ZodOptional<z.ZodUnknown>;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
  ],
  'ok'
>;
export declare const ResendVerificationResponseSchema: z.ZodDiscriminatedUnion<
  [
    z.ZodObject<
      {
        ok: z.ZodLiteral<true>;
        data: z.ZodObject<
          {
            sent: z.ZodLiteral<true>;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        ok: z.ZodLiteral<false>;
        error: z.ZodObject<
          {
            code: z.ZodString;
            message: z.ZodString;
            details: z.ZodOptional<z.ZodUnknown>;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
  ],
  'ok'
>;
/**
 * Inferred request payload types.
 */
export type SignUpRequestInput = z.infer<typeof SignUpRequestSchema>;
export type LoginRequestInput = z.infer<typeof LoginRequestSchema>;
export type RefreshRequestInput = z.infer<typeof RefreshRequestSchema>;
export type LogoutRequestInput = z.infer<typeof LogoutRequestSchema>;
export type VerifyEmailRequestInput = z.infer<typeof VerifyEmailRequestSchema>;
export type ResendVerificationRequestInput = z.infer<
  typeof ResendVerificationRequestSchema
>;
