import { z } from 'zod';

import type { AiOrchestratorBindings } from './bindings';

const authenticatedUserSchema = z.object({
  id: z.string().min(1).max(256),
  username: z.string().min(1).max(256).optional(),
  email: z.string().optional(),
  role: z.string().optional(),
  tier: z.string().optional(),
});

const authResponseSchema = z.object({
  ok: z.literal(true),
  data: authenticatedUserSchema,
});

export type AiPrincipal = z.infer<typeof authenticatedUserSchema>;

export class AuthenticationRequiredError extends Error {
  constructor() {
    super('Authentication is required.');
    this.name = 'AuthenticationRequiredError';
  }
}

export class AuthServiceUnavailableError extends Error {
  constructor(message = 'The authentication service is unavailable.') {
    super(message);
    this.name = 'AuthServiceUnavailableError';
  }
}

export async function authenticateRequest(
  request: Request,
  bindings: AiOrchestratorBindings,
): Promise<AiPrincipal> {
  const auth = bindings.AUTH_WORKER;

  if (!auth) {
    throw new AuthServiceUnavailableError(
      'The AUTH_WORKER service binding is not configured.',
    );
  }

  const headers = new Headers();
  copyHeader(request.headers, headers, 'cookie');
  copyHeader(request.headers, headers, 'authorization');
  copyHeader(request.headers, headers, 'x-request-id');
  copyHeader(request.headers, headers, 'x-correlation-id');

  const response = await auth.fetch(
    new Request('https://aerealith-auth/api/V1/auth/me', {
      method: 'GET',
      headers,
    }),
  );

  if (response.status === 401) {
    throw new AuthenticationRequiredError();
  }

  if (!response.ok) {
    throw new AuthServiceUnavailableError(
      `Authentication service returned HTTP ${response.status}.`,
    );
  }

  const body = await response.json().catch(() => undefined);
  const parsed = authResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new AuthServiceUnavailableError(
      'Authentication service returned an invalid response.',
    );
  }

  return parsed.data.data;
}

function copyHeader(
  source: Headers,
  target: Headers,
  name: string,
): void {
  const value = source.get(name);
  if (value) target.set(name, value);
}
