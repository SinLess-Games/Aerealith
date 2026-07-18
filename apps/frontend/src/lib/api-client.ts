// apps/frontend/src/lib/api-client.ts

import type { ApiResponse } from '@aerealith-ai/core'

/**
 * Error thrown when the API returns a failure envelope (or a non-JSON body).
 * Carries the stable machine-readable `code` so callers can branch on it.
 */
export class ApiError extends Error {
  public readonly code: string
  public readonly status: number
  public readonly details?: unknown

  constructor(
    code: string,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

/**
 * Fetches JSON from the `/api/V1` surface and unwraps the standard response
 * envelope. Returns `data` on success; throws {@link ApiError} on a failure
 * envelope. Session cookies are always sent (`credentials: 'include'`).
 */
export async function apiFetch<TData>(
  path: string,
  init: RequestInit = {},
): Promise<TData> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...init.headers,
    },
  })

  let body: ApiResponse<TData>
  try {
    body = (await response.json()) as ApiResponse<TData>
  } catch {
    throw new ApiError(
      'INVALID_RESPONSE',
      'The server returned an unreadable response.',
      response.status,
    )
  }

  if (!body.ok) {
    throw new ApiError(
      body.error.code,
      body.error.message,
      response.status,
      body.error.details,
    )
  }

  return body.data
}
