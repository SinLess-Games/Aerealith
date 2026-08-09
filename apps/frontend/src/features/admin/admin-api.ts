import type { AdminDashboardOverview } from '@aerealith-ai/core';

import { apiFetch } from '../../lib/api-client';

export function fetchAdminOverview(): Promise<AdminDashboardOverview> {
  return apiFetch<AdminDashboardOverview>('/api/V1/admin/overview');
}
