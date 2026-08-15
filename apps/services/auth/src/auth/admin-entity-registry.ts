import { schema as databaseSchema } from '@aerealith-ai/db';
import { getTableColumns, getTableName, isTable } from 'drizzle-orm';
import {
  getTableConfig,
  type AnyPgColumn,
  type AnyPgTable,
} from 'drizzle-orm/pg-core';

export type AdminEntityColumnType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'json'
  | 'bigint'
  | 'array'
  | 'buffer'
  | 'custom';

export type AdminEntityColumn = {
  key: string;
  databaseName: string;
  label: string;
  type: AdminEntityColumnType;
  required: boolean;
  nullable: boolean;
  hasDefault: boolean;
  primaryKey: boolean;
  sensitive: boolean;
  insertable: boolean;
  enumValues?: readonly string[];
};

export type AdminEntityDefinition = {
  name: string;
  label: string;
  singularLabel: string;
  columns: readonly AdminEntityColumn[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type RegisteredAdminEntity = {
  definition: AdminEntityDefinition;
  table: AnyPgTable;
  columns: Record<string, AnyPgColumn>;
  primaryKeys: readonly string[];
};

const SensitiveColumnKeys = new Set(['passwordHash', 'tokenHash', 'geoIp']);

const AdminEntityRegistry = createRegistry();

export function listAdminEntityDefinitions(): AdminEntityDefinition[] {
  return [...AdminEntityRegistry.values()].map(({ definition }) => definition);
}

export function getAdminEntity(
  name: string,
): RegisteredAdminEntity | undefined {
  return AdminEntityRegistry.get(name === 'sessions' ? 'user_sessions' : name);
}

function createRegistry(): Map<string, RegisteredAdminEntity> {
  const registry = new Map<string, RegisteredAdminEntity>();

  for (const candidate of Object.values(databaseSchema)) {
    if (!isTable(candidate)) continue;
    const name = getTableName(candidate);
    if (registry.has(name)) continue;

    const columns = getTableColumns(candidate) as Record<string, AnyPgColumn>;
    const config = getTableConfig(candidate as AnyPgTable);
    const primaryDatabaseNames = new Set([
      ...config.primaryKeys.flatMap((key) =>
        key.columns.map((column) => column.name),
      ),
      ...Object.values(columns)
        .filter((column) => column.primary)
        .map((column) => column.name),
    ]);
    const primaryKeys = Object.entries(columns)
      .filter(([, column]) => primaryDatabaseNames.has(column.name))
      .map(([key]) => key);
    const definitions = Object.entries(columns).map(([key, column]) => ({
      key,
      databaseName: column.name,
      label: humanize(key),
      type: normalizeColumnType(column.dataType),
      required: column.notNull && !column.hasDefault,
      nullable: !column.notNull,
      hasDefault: column.hasDefault,
      primaryKey: primaryDatabaseNames.has(column.name),
      sensitive: SensitiveColumnKeys.has(key),
      insertable: column.generated === undefined,
      ...(column.enumValues?.length
        ? { enumValues: [...column.enumValues] }
        : {}),
    }));
    const label = humanize(name);

    registry.set(name, {
      definition: {
        name,
        label,
        singularLabel: singularize(label),
        columns: definitions,
        canCreate: true,
        canUpdate: name === 'users' || name === 'user_sessions',
        canDelete: name === 'users' || name === 'user_sessions',
      },
      table: candidate as AnyPgTable,
      columns,
      primaryKeys,
    });
  }

  return new Map(
    [...registry].sort(([left], [right]) => left.localeCompare(right)),
  );
}

function normalizeColumnType(value: string): AdminEntityColumnType {
  return (
    [
      'string',
      'number',
      'boolean',
      'date',
      'json',
      'bigint',
      'array',
      'buffer',
    ].includes(value)
      ? value
      : 'custom'
  ) as AdminEntityColumnType;
}

function humanize(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function singularize(value: string): string {
  if (value.endsWith('ies')) return `${value.slice(0, -3)}y`;
  if (value.endsWith('sses')) return value.slice(0, -2);
  if (value.endsWith('s')) return value.slice(0, -1);
  return value;
}
