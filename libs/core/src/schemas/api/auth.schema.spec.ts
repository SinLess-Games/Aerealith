// libs/core/src/schemas/api/auth.schema.spec.ts

import { describe, expect, it } from 'vitest'

import {
  AuthSessionResponseSchema,
  AuthSessionSchema,
  AuthTokensSchema,
  AuthUserResponseSchema,
  AuthUserSchema,
  EmailSchema,
  LoginRequestSchema,
  LogoutRequestSchema,
  LogoutResponseSchema,
  PasswordSchema,
  PublicAuthUserResponseSchema,
  PublicAuthUserSchema,
  RefreshRequestSchema,
  RefreshResponseSchema,
  ResendVerificationRequestSchema,
  ResendVerificationResponseSchema,
  SignUpRequestSchema,
  TokenSchema,
  UsernameSchema,
  VerifyEmailRequestSchema,
  VerifyEmailResponseSchema,
} from './auth.schema'

const userId = '550e8400-e29b-41d4-a716-446655440000'

describe('authentication field schemas', () => {
  it('normalizes a valid username', () => {
    const result = UsernameSchema.safeParse('  Andy_Pierce  ')

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toBe('andy_pierce')
    }
  })

  it('rejects a username shorter than three characters', () => {
    const result = UsernameSchema.safeParse('ab')

    expect(result.success).toBe(false)
  })

  it('rejects a username with unsupported characters', () => {
    const result = UsernameSchema.safeParse('andy pierce')

    expect(result.success).toBe(false)
  })

  it('normalizes a valid email address', () => {
    const result = EmailSchema.safeParse('  Andy@Example.COM  ')

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toBe('andy@example.com')
    }
  })

  it('rejects an invalid email address', () => {
    const result = EmailSchema.safeParse('not-an-email')

    expect(result.success).toBe(false)
  })

  it('accepts a password with at least eight characters', () => {
    const result = PasswordSchema.safeParse('password123')

    expect(result.success).toBe(true)
  })

  it('rejects a password shorter than eight characters', () => {
    const result = PasswordSchema.safeParse('short')

    expect(result.success).toBe(false)
  })

  it('rejects an empty token', () => {
    const result = TokenSchema.safeParse('')

    expect(result.success).toBe(false)
  })

  it('accepts a non-empty token', () => {
    const result = TokenSchema.safeParse('token-value')

    expect(result.success).toBe(true)
  })
})

describe('AuthUserSchema', () => {
  it('accepts a valid authenticated user', () => {
    const result = AuthUserSchema.safeParse({
      id: userId,
      username: 'andy',
      email: 'andy@example.com',
      emailVerified: true,
      displayName: 'Andy Pierce',
      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    })

    expect(result.success).toBe(true)
  })

  it('accepts an authenticated user without a display name', () => {
    const result = AuthUserSchema.safeParse({
      id: userId,
      username: 'andy',
      email: 'andy@example.com',
      emailVerified: false,
      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    })

    expect(result.success).toBe(true)
  })

  it('rejects an authenticated user with an invalid ID', () => {
    const result = AuthUserSchema.safeParse({
      id: 'not-a-uuid',
      username: 'andy',
      email: 'andy@example.com',
      emailVerified: false,
      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    })

    expect(result.success).toBe(false)
  })
})

describe('PublicAuthUserSchema', () => {
  it('accepts a valid public user', () => {
    const result = PublicAuthUserSchema.safeParse({
      id: userId,
      username: 'andy',
      displayName: 'Andy Pierce',
    })

    expect(result.success).toBe(true)
  })

  it('does not require a display name', () => {
    const result = PublicAuthUserSchema.safeParse({
      id: userId,
      username: 'andy',
    })

    expect(result.success).toBe(true)
  })
})

describe('AuthTokensSchema', () => {
  it('accepts a valid token payload', () => {
    const result = AuthTokensSchema.safeParse({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    })

    expect(result.success).toBe(true)
  })

  it('rejects a non-positive token expiration', () => {
    const result = AuthTokensSchema.safeParse({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 0,
      tokenType: 'Bearer',
    })

    expect(result.success).toBe(false)
  })

  it('rejects an unsupported token type', () => {
    const result = AuthTokensSchema.safeParse({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Basic',
    })

    expect(result.success).toBe(false)
  })
})

describe('AuthSessionSchema', () => {
  it('accepts a valid authenticated session', () => {
    const result = AuthSessionSchema.safeParse({
      user: {
        id: userId,
        username: 'andy',
        email: 'andy@example.com',
        emailVerified: true,
        displayName: 'Andy Pierce',
        createdAt: '2026-06-20T12:00:00.000Z',
        updatedAt: '2026-06-20T12:10:00.000Z',
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    })

    expect(result.success).toBe(true)
  })

  it('rejects a session with invalid token data', () => {
    const result = AuthSessionSchema.safeParse({
      user: {
        id: userId,
        username: 'andy',
        email: 'andy@example.com',
        emailVerified: true,
        createdAt: '2026-06-20T12:00:00.000Z',
        updatedAt: '2026-06-20T12:10:00.000Z',
      },
      tokens: {
        accessToken: '',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    })

    expect(result.success).toBe(false)
  })
})

describe('authentication request schemas', () => {
  it('accepts and normalizes a valid sign-up request', () => {
    const result = SignUpRequestSchema.safeParse({
      username: '  Andy_Pierce  ',
      email: '  Andy@Example.COM  ',
      password: 'password123',
      displayName: '  Andy Pierce  ',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toEqual({
        username: 'andy_pierce',
        email: 'andy@example.com',
        password: 'password123',
        displayName: 'Andy Pierce',
      })
    }
  })

  it('rejects a sign-up request with an invalid username', () => {
    const result = SignUpRequestSchema.safeParse({
      username: 'a!',
      email: 'andy@example.com',
      password: 'password123',
    })

    expect(result.success).toBe(false)
  })

  it('rejects a sign-up request with a short password', () => {
    const result = SignUpRequestSchema.safeParse({
      username: 'andy',
      email: 'andy@example.com',
      password: 'short',
    })

    expect(result.success).toBe(false)
  })

  it('accepts a valid login request', () => {
    const result = LoginRequestSchema.safeParse({
      usernameOrEmail: '  Andy@Example.COM  ',
      password: 'password123',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.usernameOrEmail).toBe('Andy@Example.COM')
    }
  })

  it('rejects an empty login identifier', () => {
    const result = LoginRequestSchema.safeParse({
      usernameOrEmail: '   ',
      password: 'password123',
    })

    expect(result.success).toBe(false)
  })

  it('accepts a valid refresh request', () => {
    const result = RefreshRequestSchema.safeParse({
      refreshToken: 'refresh-token',
    })

    expect(result.success).toBe(true)
  })

  it('rejects an empty refresh token', () => {
    const result = RefreshRequestSchema.safeParse({
      refreshToken: '',
    })

    expect(result.success).toBe(false)
  })

  it('accepts logout without a refresh token', () => {
    const result = LogoutRequestSchema.safeParse({})

    expect(result.success).toBe(true)
  })

  it('accepts logout with a refresh token', () => {
    const result = LogoutRequestSchema.safeParse({
      refreshToken: 'refresh-token',
    })

    expect(result.success).toBe(true)
  })

  it('accepts a valid verification request', () => {
    const result = VerifyEmailRequestSchema.safeParse({
      token: 'verification-token',
    })

    expect(result.success).toBe(true)
  })

  it('rejects an empty verification token', () => {
    const result = VerifyEmailRequestSchema.safeParse({
      token: '',
    })

    expect(result.success).toBe(false)
  })

  it('accepts a valid resend verification request', () => {
    const result = ResendVerificationRequestSchema.safeParse({
      email: '  Andy@Example.COM  ',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.email).toBe('andy@example.com')
    }
  })
})

describe('authentication response schemas', () => {
  it('accepts a valid auth session response', () => {
    const result = AuthSessionResponseSchema.safeParse({
      ok: true,
      data: {
        user: {
          id: userId,
          username: 'andy',
          email: 'andy@example.com',
          emailVerified: true,
          createdAt: '2026-06-20T12:00:00.000Z',
          updatedAt: '2026-06-20T12:10:00.000Z',
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      },
    })

    expect(result.success).toBe(true)
  })

  it('accepts a valid authenticated-user response', () => {
    const result = AuthUserResponseSchema.safeParse({
      ok: true,
      data: {
        id: userId,
        username: 'andy',
        email: 'andy@example.com',
        emailVerified: true,
        createdAt: '2026-06-20T12:00:00.000Z',
        updatedAt: '2026-06-20T12:10:00.000Z',
      },
    })

    expect(result.success).toBe(true)
  })

  it('accepts a valid public-user response', () => {
    const result = PublicAuthUserResponseSchema.safeParse({
      ok: true,
      data: {
        id: userId,
        username: 'andy',
      },
    })

    expect(result.success).toBe(true)
  })

  it('accepts a valid refresh response', () => {
    const result = RefreshResponseSchema.safeParse({
      ok: true,
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    })

    expect(result.success).toBe(true)
  })

  it('accepts a valid logout response', () => {
    const result = LogoutResponseSchema.safeParse({
      ok: true,
      data: null,
    })

    expect(result.success).toBe(true)
  })

  it('rejects a logout response with non-null data', () => {
    const result = LogoutResponseSchema.safeParse({
      ok: true,
      data: {
        loggedOut: true,
      },
    })

    expect(result.success).toBe(false)
  })

  it('accepts a valid verification response', () => {
    const result = VerifyEmailResponseSchema.safeParse({
      ok: true,
      data: {
        emailVerified: true,
      },
    })

    expect(result.success).toBe(true)
  })

  it('rejects a verification response when emailVerified is false', () => {
    const result = VerifyEmailResponseSchema.safeParse({
      ok: true,
      data: {
        emailVerified: false,
      },
    })

    expect(result.success).toBe(false)
  })

  it('accepts a valid resend-verification response', () => {
    const result = ResendVerificationResponseSchema.safeParse({
      ok: true,
      data: {
        sent: true,
      },
    })

    expect(result.success).toBe(true)
  })

  it('accepts a valid authentication error response', () => {
    const result = AuthSessionResponseSchema.safeParse({
      ok: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username, email address, or password.',
      },
    })

    expect(result.success).toBe(true)
  })
})
