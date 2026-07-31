export interface TurnstileEnvironment {
  TURNSTILE_SECRET?: string;
  TURNSTILE_HOSTNAMES?: string;
}

type SiteverifyResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
};

export async function verifyRegistrationTurnstile(
  request: Request,
  environment: TurnstileEnvironment,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (!environment.TURNSTILE_SECRET) return true;

  const expectedHostnames = new Set(
    (environment.TURNSTILE_HOSTNAMES ?? '')
      .split(',')
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );
  if (expectedHostnames.size === 0) return false;

  let token: unknown;
  try {
    const body = (await request.clone().json()) as Record<string, unknown>;
    token = body['turnstileToken'];
  } catch {
    return false;
  }
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) {
    return false;
  }

  try {
    const response = await fetcher(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({
          secret: environment.TURNSTILE_SECRET,
          response: token,
          remoteip: request.headers.get('cf-connecting-ip') ?? '',
        }),
      },
    );
    if (!response.ok) return false;
    const result = (await response.json()) as SiteverifyResponse;
    return (
      result.success === true &&
      result.action === 'registration' &&
      typeof result.hostname === 'string' &&
      expectedHostnames.has(result.hostname)
    );
  } catch {
    return false;
  }
}
