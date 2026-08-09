import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiChevronLeft,
  FiChevronRight,
  FiDatabase,
  FiEdit2,
  FiFilter,
  FiBookmark,
  FiColumns,
  FiGrid,
  FiList,
  FiCopy,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';

import {
  deleteEntity,
  fetchEntities,
  updateEntity,
  type EntityRecord,
  type EntityType,
} from '../../../features/admin/entity-api';
import styles from './entity-viewer.module.css';

const editableFields: Record<EntityType, readonly string[]> = {
  users: [
    'username',
    'email',
    'status',
    'emailVerified',
    'role',
    'tier',
    'metadata',
  ],
  sessions: ['deviceName', 'revokedAt'],
};

export function EntityViewerRoute() {
  const queryClient = useQueryClient();
  const [entity, setEntity] = useState<EntityType>('users');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  const entities = useQuery({
    queryKey: ['admin', 'entities', entity, search, page],
    queryFn: () => fetchEntities(entity, search, page),
    retry: false,
  });
  const selected = useMemo(
    () =>
      entities.data?.records.find((record) => record.id === selectedId) ??
      entities.data?.records[0],
    [entities.data, selectedId],
  );

  const update = useMutation({
    mutationFn: (input: { id: string; changes: Record<string, unknown> }) =>
      updateEntity(entity, input.id, input.changes),
    onSuccess: async (record) => {
      setEditing(false);
      setSelectedId(record.id);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'entities'] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteEntity(entity, id),
    onSuccess: async () => {
      setSelectedId(undefined);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'entities'] });
    },
  });

  const selectEntity = (next: EntityType) => {
    setEntity(next);
    setPage(1);
    setSelectedId(undefined);
    setEditing(false);
  };

  const beginEdit = (record: EntityRecord) => {
    setDraft(
      Object.fromEntries(
        editableFields[entity].map((field) => [field, record[field]]),
      ),
    );
    setEditing(true);
  };

  return (
    <section className={styles.viewer}>
      <div className="text-sm font-semibold text-[#50fa68]">
        Admin <span className="px-2 text-slate-600">›</span> Entity Viewer
        <span className="px-2 text-slate-600">›</span> Entities
      </div>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Entity Viewer</h1>
          <p className="mt-1 text-sm text-slate-400">
            Explore, inspect, and safely manage data across your database.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void entities.refetch()}
          className="flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:border-[#50fa68]/40"
        >
          <FiRefreshCw
            className={
              entities.isFetching
                ? 'animate-spin text-[#50fa68]'
                : 'text-[#50fa68]'
            }
          />
          Refresh
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(390px,.88fr)]">
        <div className={`${styles.panel} p-3`}>
          <div className="grid gap-3 sm:grid-cols-[145px_1fr_auto]">
            <select
              aria-label="Entity type"
              value={entity}
              onChange={(event) =>
                selectEntity(event.target.value as EntityType)
              }
              className={`${styles.control} px-3 py-2.5`}
            >
              <option value="users">Users</option>
              <option value="sessions">Sessions</option>
            </select>
            <form
              className="relative"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setSearch(searchInput.trim());
              }}
            >
              <FiSearch className="absolute left-3 top-3 text-slate-500" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className={`${styles.control} py-2.5 pl-10 pr-4`}
                placeholder={`Search ${entity} by name, email, ID…`}
              />
            </form>
            <button className="flex items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold">
              <FiFilter /> Filters{' '}
              <span className="rounded-full bg-[#50fa68]/15 px-1.5 text-[#50fa68]">
                2
              </span>
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {entity === 'users' ? (
              <>
                <span className="rounded-md border border-white/10 px-3 py-2">
                  Role: admin, super_admin &nbsp; ×
                </span>
                <span className="rounded-md border border-white/10 px-3 py-2">
                  Status: active &nbsp; ×
                </span>
              </>
            ) : (
              <span className="rounded-md border border-white/10 px-3 py-2">
                Status: active &nbsp; ×
              </span>
            )}
            <button className="px-3 py-2 text-[#50fa68]">＋ Add filter</button>
            <button className="ml-auto px-2 text-[#50fa68]">Clear all</button>
          </div>
        </div>
        <div
          className={`${styles.panel} flex items-center justify-between p-3`}
        >
          <button className="px-2 text-sm font-semibold">Saved views⌄</button>
          <button className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm">
            <FiBookmark /> Save current view
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(390px,.88fr)]">
        <div className="min-w-0">
          <div className={`${styles.panel} overflow-hidden`}>
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="font-semibold">
                Results{' '}
                <span className="text-slate-500">
                  ({entities.data?.total ?? 0})
                </span>
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <FiColumns /> Columns
                </span>
                <span>Density⌄</span>
                <span className="rounded-md border border-[#50fa68]/40 p-2 text-[#50fa68]">
                  <FiList />
                </span>
                <span className="rounded-md border border-white/10 p-2">
                  <FiGrid />
                </span>
              </div>
            </div>
            {entities.isError ? (
              <p
                role="alert"
                className="border-t border-red-500/20 bg-red-500/5 p-5 text-sm text-red-300"
              >
                The entity records could not be loaded.
              </p>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-t border-white/10 text-xs text-slate-500">
                  <tr>
                    {columnsFor(entity).map((column) => (
                      <th key={column} className="px-4 py-3 font-medium">
                        {labelFor(column)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entities.data?.records.map((record) => (
                    <tr
                      key={record.id}
                      className={`${styles.row} ${record.id === selected?.id ? styles.selected : ''} cursor-pointer`}
                      onClick={() => {
                        setSelectedId(record.id);
                        setEditing(false);
                      }}
                    >
                      {columnsFor(entity).map((column) => (
                        <td
                          key={column}
                          className="max-w-48 truncate px-4 py-3 text-slate-300"
                        >
                          {formatValue(record[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-slate-500">
              <span>
                Showing{' '}
                {(page - 1) * 25 + (entities.data?.records.length ? 1 : 0)} to{' '}
                {(page - 1) * 25 + (entities.data?.records.length ?? 0)} of{' '}
                {entities.data?.total ?? 0} results
              </span>
              <div className="flex gap-2">
                <button
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="rounded-md border border-white/10 p-2 disabled:opacity-30"
                >
                  <FiChevronLeft />
                </button>
                <button
                  aria-label="Next page"
                  disabled={
                    !entities.data ||
                    page * entities.data.pageSize >= entities.data.total
                  }
                  onClick={() => setPage((value) => value + 1)}
                  className="rounded-md border border-white/10 p-2 disabled:opacity-30"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className={`${styles.panel} min-h-[600px] overflow-hidden`}>
          {selected ? (
            <>
              <div className="flex items-start justify-between border-b border-white/10 p-5">
                <div>
                  <p className="text-xs capitalize text-slate-500">
                    {entity.slice(0, -1)}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {String(
                      selected.username ?? selected.deviceName ?? selected.id,
                    )}
                  </h2>
                  <p className="mt-1 max-w-sm truncate text-xs text-slate-500">
                    ID: {selected.id}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    aria-label="Copy entity ID"
                    className="rounded-md p-2 text-slate-400 hover:text-[#50fa68]"
                    onClick={() =>
                      void navigator.clipboard?.writeText(selected.id)
                    }
                  >
                    <FiCopy />
                  </button>
                  <button
                    aria-label="Edit entity"
                    onClick={() => beginEdit(selected)}
                    className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-[#50fa68]"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    aria-label="Delete entity"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete this ${entity.slice(0, -1)}? This action soft-deletes the record.`,
                        )
                      ) {
                        remove.mutate(selected.id);
                      }
                    }}
                    className="rounded-md p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              <div className="flex gap-7 overflow-x-auto border-b border-white/10 px-5 text-xs text-slate-400">
                {[
                  'Overview',
                  'Roles & Permissions',
                  'Sessions',
                  'Audit Logs',
                  'Related',
                ].map((tab, index) => (
                  <button
                    key={tab}
                    className={`whitespace-nowrap border-b-2 py-3 ${index === 0 ? 'border-[#50fa68] text-[#50fa68]' : 'border-transparent'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-5">
                {editing ? (
                  <EditForm
                    entity={entity}
                    draft={draft}
                    setDraft={setDraft}
                    pending={update.isPending}
                    onCancel={() => setEditing(false)}
                    onSave={() =>
                      update.mutate({ id: selected.id, changes: draft })
                    }
                  />
                ) : (
                  <>
                    <h3 className="font-semibold">Record overview</h3>
                    <dl className="mt-4 grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-sm">
                      {Object.entries(selected)
                        .filter(([key]) => key !== 'metadata')
                        .map(([key, value]) => (
                          <div key={key} className="contents">
                            <dt className="text-slate-500">{labelFor(key)}</dt>
                            <dd className="min-w-0 break-words text-slate-200">
                              {formatValue(value)}
                            </dd>
                          </div>
                        ))}
                    </dl>
                    {selected.metadata !== undefined ? (
                      <>
                        <div className="mt-7 flex items-center justify-between">
                          <h3 className="font-semibold">Metadata (JSON)</h3>
                          <button className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs">
                            <FiCopy /> Copy
                          </button>
                        </div>
                        <pre className={`${styles.json} mt-3 max-h-56 p-4`}>
                          {JSON.stringify(selected.metadata, null, 2)}
                        </pre>
                      </>
                    ) : null}
                    <h3 className="mt-5 rounded-lg border border-white/10 px-4 py-3 font-semibold">
                      Raw Database Record⌄
                    </h3>
                    <pre className={`${styles.json} mt-3 max-h-80 p-4`}>
                      {JSON.stringify(selected, null, 2)}
                    </pre>
                  </>
                )}
                {update.isError || remove.isError ? (
                  <p role="alert" className="mt-4 text-sm text-red-300">
                    The database operation failed. Check the values and your
                    permissions.
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex min-h-[600px] flex-col items-center justify-center p-8 text-center text-slate-500">
              <FiDatabase className="text-4xl text-[#50fa68]" />
              <p className="mt-4">Select an entity record to inspect it.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function EditForm({
  entity,
  draft,
  setDraft,
  pending,
  onCancel,
  onSave,
}: {
  entity: EntityType;
  draft: Record<string, unknown>;
  setDraft: (draft: Record<string, unknown>) => void;
  pending: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Edit record</h3>
        <button type="button" aria-label="Cancel editing" onClick={onCancel}>
          <FiX />
        </button>
      </div>
      <div className="mt-5 space-y-4">
        {editableFields[entity].map((field) => (
          <label
            key={field}
            className="block text-xs font-medium text-slate-400"
          >
            {labelFor(field)}
            {field === 'metadata' ? (
              <textarea
                rows={7}
                className={`${styles.control} mt-2 px-3 py-2 font-mono text-xs`}
                value={JSON.stringify(draft[field] ?? {}, null, 2)}
                onChange={(event) => {
                  try {
                    setDraft({
                      ...draft,
                      [field]: JSON.parse(event.target.value),
                    });
                  } catch {
                    // Keep the last valid JSON object until input is valid.
                  }
                }}
              />
            ) : field === 'emailVerified' ? (
              <select
                className={`${styles.control} mt-2 px-3 py-2`}
                value={String(draft[field] ?? false)}
                onChange={(event) =>
                  setDraft({ ...draft, [field]: event.target.value === 'true' })
                }
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : (
              <input
                className={`${styles.control} mt-2 px-3 py-2`}
                value={draft[field] == null ? '' : String(draft[field])}
                onChange={(event) =>
                  setDraft({ ...draft, [field]: event.target.value || null })
                }
              />
            )}
          </label>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-white/10 px-4 py-2 text-sm"
        >
          Cancel
        </button>
        <button
          disabled={pending}
          className="rounded-md border border-[#50fa68]/40 bg-[#50fa68]/10 px-4 py-2 text-sm font-semibold text-[#50fa68]"
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function columnsFor(entity: EntityType) {
  return entity === 'users'
    ? ['id', 'username', 'email', 'role', 'status', 'createdAt']
    : ['id', 'userId', 'deviceName', 'ipAddress', 'revokedAt', 'expiresAt'];
}

function labelFor(value: string) {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  const text = String(value);
  return /^\d{4}-\d{2}-\d{2}T/.test(text)
    ? new Date(text).toLocaleString()
    : text;
}

export default EntityViewerRoute;
