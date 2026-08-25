import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchProfile, updateProfile } from './profile-api';

export const PROFILE_QUERY_KEY = ['account', 'profile'] as const;

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchProfile,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
      void queryClient.invalidateQueries({
        queryKey: ['account'],
        exact: true,
      });
    },
  });
}
