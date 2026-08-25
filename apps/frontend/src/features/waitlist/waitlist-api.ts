import { apiFetch } from '../../lib/api-client';

export type JoinWaitlistInput = {
  email: string;
  role?: string | null;
  newsletter: boolean;
};

export type JoinWaitlistResult = {
  joined: true;
  newsletterSubscribed: boolean;
};

export function joinWaitlist(
  input: JoinWaitlistInput,
): Promise<JoinWaitlistResult> {
  return apiFetch('/api/V1/waitlist', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
