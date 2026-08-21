import { apiFetch } from '../../lib/api-client';

export type EntityColumnType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'json'
  | 'bigint'
  | 'array'
  | 'buffer'
  | 'custom';
export type EntityColumn = {
  key: string;
  databaseName: string;
  label: string;
  type: EntityColumnType;
  required: boolean;
  nullable: boolean;
  hasDefault: boolean;
  primaryKey: boolean;
  sensitive: boolean;
  insertable: boolean;
  enumValues?: readonly string[];
};
export type EntityDefinition = {
  name: string;
  label: string;
  singularLabel: string;
  columns: readonly EntityColumn[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};
export type EntityRecord = Record<string, unknown> & { id: string };
export type EntityPage = {
  entity: string;
  records: EntityRecord[];
  total: number;
  page: number;
  pageSize: number;
};
export type CreateUserEntityInput = {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  status: 'active' | 'disabled' | 'suspended';
  tier:
    'basic' | 'basic_plus' | 'premium' | 'premium_plus' | 'pro' | 'pro_plus';
  emailVerified: boolean;
  metadata?: Record<string, unknown>;
};

export function fetchEntityCatalog(): Promise<EntityDefinition[]> {
  return apiFetch('/api/V1/admin/entities');
}

export function fetchEntities(
  entity: string,
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
  entity: string,
  id: string,
  changes: Record<string, unknown>,
): Promise<EntityRecord> {
  return apiFetch(`/api/V1/admin/entities/${entity}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

export function createEntity(
  entity: string,
  input: Record<string, unknown> | CreateUserEntityInput,
): Promise<EntityRecord> {
  return apiFetch(`/api/V1/admin/entities/${entity}`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteEntity(entity: string, id: string): Promise<null> {
  return apiFetch(`/api/V1/admin/entities/${entity}/${id}`, {
    method: 'DELETE',
  });
}
