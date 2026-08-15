import type {
  UpdateUserProfileContract,
  UserProfileContract,
} from '@aerealith-ai/core';

import { apiFetch } from '../../lib/api-client';

export function fetchProfile(): Promise<UserProfileContract> {
  return apiFetch('/api/V1/profile');
}

export function updateProfile(
  input: UpdateUserProfileContract,
): Promise<UserProfileContract> {
  return apiFetch('/api/V1/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
