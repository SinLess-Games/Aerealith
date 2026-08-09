import { apiFetch } from '../../lib/api-client';

export type EntityType = 'users' | 'sessions';
export type EntityRecord = Record<string, unknown> & { id: string };
export type EntityPage = {
  entity: EntityType;
  records: EntityRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export function fetchEntities(
  entity: EntityType,
  search: string,
  page: number,
): Promise<EntityPage> {
  const params = new URLSearchParams({
    search,
    page: String(page),
    pageSize: '25',
  });
  return apiFetch(`/api/V1/admin/entities/${entity}?${params}`);
}

export function updateEntity(
  entity: EntityType,
  id: string,
  changes: Record<string, unknown>,
): Promise<EntityRecord> {
  return apiFetch(`/api/V1/admin/entities/${entity}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

export function deleteEntity(entity: EntityType, id: string): Promise<null> {
  return apiFetch(`/api/V1/admin/entities/${entity}/${id}`, {
    method: 'DELETE',
  });
}
