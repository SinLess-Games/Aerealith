import type { AccountDetails, UpdateAccountRequest } from '@aerealith-ai/core';

import { apiFetch } from '../../lib/api-client';

export function fetchAccount(): Promise<AccountDetails> {
  return apiFetch('/api/V1/account');
}

export function updateAccount(
  input: UpdateAccountRequest,
): Promise<AccountDetails> {
  return apiFetch('/api/V1/account', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
