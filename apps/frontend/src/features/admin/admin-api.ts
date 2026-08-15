import type { AdminDashboardOverview } from '@aerealith-ai/core';

import { apiFetch } from '../../lib/api-client';

export const ADMIN_OVERVIEW_QUERY_KEY = ['admin', 'overview'] as const;

export function fetchAdminOverview(): Promise<AdminDashboardOverview> {
  return apiFetch<AdminDashboardOverview>('/api/V1/admin/overview');
}
