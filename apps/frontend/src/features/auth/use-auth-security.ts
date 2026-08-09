import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  completePasswordReset,
  fetchSessions,
  requestPasswordReset,
  revokeOtherSessions,
  revokeSession,
} from './auth-api';

export const AUTH_SESSIONS_QUERY_KEY = ['auth', 'sessions'] as const;

export function useAuthSessions() {
  return useQuery({
    queryKey: AUTH_SESSIONS_QUERY_KEY,
    queryFn: fetchSessions,
    retry: false,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeSession,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: AUTH_SESSIONS_QUERY_KEY }),
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeOtherSessions,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: AUTH_SESSIONS_QUERY_KEY }),
  });
}

export function usePasswordResetRequest() {
  return useMutation({ mutationFn: requestPasswordReset });
}

export function usePasswordResetComplete() {
  return useMutation({ mutationFn: completePasswordReset });
}
