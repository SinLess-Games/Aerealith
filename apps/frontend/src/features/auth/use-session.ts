// apps/frontend/src/features/auth/use-session.ts

import type { AuthUser } from '@aerealith-ai/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '../../lib/api-client';
import { fetchCurrentUser, login, logout, signUp } from './auth-api';

export const SESSION_QUERY_KEY = ['session'] as const;

/**
 * The current session. `user` is defined when signed in; a 401 resolves to a
 * signed-out state rather than a surfaced error.
 */
export function useSession() {
  const query = useQuery<AuthUser, ApiError>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 60_000,
  });

  const isUnauthenticated = query.error?.status === 401;

  return {
    user: isUnauthenticated ? null : (query.data ?? null),
    isAuthenticated: !isUnauthenticated && Boolean(query.data),
    isLoading: query.isLoading,
    isError: query.isError && !isUnauthenticated,
    error: query.isError && !isUnauthenticated ? query.error : null,
    refetch: query.refetch,
  };
}

/** Sign-in mutation that refreshes the session cache on success. */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => queryClient.setQueryData(SESSION_QUERY_KEY, user),
  });
}

/** Sign-up mutation that refreshes the session cache on success. */
export function useSignUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signUp,
    onSuccess: (user) => {
      if (user.emailVerified) {
        queryClient.setQueryData(SESSION_QUERY_KEY, user);
      } else {
        queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
      }
    },
  });
}

/** Logout mutation that clears the session cache. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: ['account'] });
      queryClient.removeQueries({ queryKey: ['profile'] });
      queryClient.removeQueries({ queryKey: ['admin'] });
    },
  });
}
