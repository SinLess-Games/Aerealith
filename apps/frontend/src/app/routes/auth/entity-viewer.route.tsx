import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  StatusAnnouncement,
} from '@aerealith-ai/ui';
import {
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiDatabase,
  FiEdit2,
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
  users: ['username', 'email', 'status', 'tier', 'metadata'],
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

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
      setAnnouncement(`${entity.slice(0, -1)} updated successfully.`);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'entities'] });
    },
    onError: () => setAnnouncement('The update could not be completed.'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteEntity(entity, id),
    onSuccess: async () => {
      setSelectedId(undefined);
      setDeleteDialogOpen(false);
      setAnnouncement(`${entity.slice(0, -1)} deleted successfully.`);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'entities'] });
    },
    onError: () => setAnnouncement('The record could not be deleted.'),
  });

  const selectEntity = (next: EntityType) => {
    setEntity(next);
    setPage(1);
    setSelectedId(undefined);
    setEditing(false);
    setDeleteDialogOpen(false);
    setAnnouncement('');
  };

  const beginEdit = (record: EntityRecord) => {
    setDraft(
      Object.fromEntries(
        editableFields[entity].map((field) => [field, record[field]]),
      ),
    );
    setEditing(true);
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setAnnouncement(`${label} copied to clipboard.`);
    } catch {
      setAnnouncement(`Unable to copy ${label.toLowerCase()}.`);
    }
  };

  return (
    <section className={styles.viewer} aria-labelledby="entity-viewer-title">
      <StatusAnnouncement className="sr-only">
        {announcement}
      </StatusAnnouncement>
      <p className={styles.breadcrumb}>
        Admin <span aria-hidden="true">›</span> Entity Viewer{' '}
        <span aria-hidden="true">›</span> Entities
      </p>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            id="entity-viewer-title"
            className="text-4xl font-bold tracking-tight"
          >
            Entity Viewer
          </h1>
          <p className="mt-1 text-sm text-[var(--ae-foreground-muted)]">
            Explore, inspect, and safely manage data across your database.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void entities.refetch()}
          disabled={entities.isFetching}
        >
          <FiRefreshCw
            className={entities.isFetching ? 'animate-spin' : undefined}
            aria-hidden="true"
          />
          {entities.isFetching ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(20rem,.88fr)]">
        <div className={`${styles.panel} p-3`}>
          <div className="grid gap-3 sm:grid-cols-[145px_minmax(0,1fr)]">
            <label className="sr-only" htmlFor="entity-type">
              Entity type
            </label>
            <select
              id="entity-type"
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
              <FiSearch
                className="absolute left-3 top-3 text-[var(--ae-foreground-subtle)]"
                aria-hidden="true"
              />
              <label className="sr-only" htmlFor="entity-search">
                Search {entity}
              </label>
              <input
                id="entity-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className={`${styles.control} py-2.5 pl-10 pr-4`}
                placeholder={`Search ${entity} by name, email, ID…`}
              />
            </form>
          </div>
          <p className="mt-3 text-xs text-[var(--ae-foreground-muted)]">
            Search filters are applied when you submit the search field.
            Advanced filters and saved views are not available yet.
          </p>
        </div>
        <div
          className={`${styles.panel} flex items-center p-3 text-sm text-[var(--ae-foreground-muted)]`}
        >
          <span>Current view: Default</span>
        </div>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(20rem,.88fr)]">
        <div className="min-w-0">
          <div className={`${styles.panel} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <h2 className="font-semibold">
                Results{' '}
                <span className="text-[var(--ae-foreground-muted)]">
                  ({entities.data?.total ?? 0})
                </span>
              </h2>
              <span className="text-xs text-[var(--ae-foreground-muted)]">
                Select a row to inspect its record.
              </span>
            </div>
            {entities.isError ? (
              <div role="alert" className={styles.error}>
                <p>The entity records could not be loaded.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => void entities.refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : null}
            <div className={styles.tableScroll}>
              <table className="w-full min-w-[42.5rem] text-left text-sm">
                <thead className={styles.tableHead}>
                  <tr>
                    {columnsFor(entity).map((column) => (
                      <th key={column} className="px-4 py-3 font-medium">
                        {labelFor(column)}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody aria-busy={entities.isLoading}>
                  {entities.isLoading ? (
                    <tr>
                      <td
                        colSpan={columnsFor(entity).length + 1}
                        className="px-4 py-10 text-center text-[var(--ae-foreground-muted)]"
                      >
                        Loading {entity}…
                      </td>
                    </tr>
                  ) : null}
                  {entities.data?.records.map((record) => (
                    <tr
                      key={record.id}
                      className={`${styles.row} ${record.id === selected?.id ? styles.selected : ''}`}
                    >
                      {columnsFor(entity).map((column) => (
                        <td
                          key={column}
                          className="max-w-48 truncate px-4 py-3 text-[var(--ae-foreground)]"
                        >
                          {formatValue(record[column])}
                        </td>
                      ))}
                      <td className="px-4 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-pressed={record.id === selected?.id}
                          aria-label={`Inspect ${entity.slice(0, -1)} ${String(record.username ?? record.deviceName ?? record.id)}`}
                          className={styles.inspectButton}
                          onClick={() => {
                            setSelectedId(record.id);
                            setEditing(false);
                          }}
                        >
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!entities.isLoading &&
                  !entities.isError &&
                  entities.data?.records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columnsFor(entity).length + 1}
                        className="px-4 py-10 text-center text-[var(--ae-foreground-muted)]"
                      >
                        No {entity} match this search.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ae-divider)] px-4 py-3 text-xs text-[var(--ae-foreground-muted)]">
              <span>
                Showing{' '}
                {(page - 1) * 25 + (entities.data?.records.length ? 1 : 0)} to{' '}
                {(page - 1) * 25 + (entities.data?.records.length ?? 0)} of{' '}
                {entities.data?.total ?? 0} results
              </span>
              <div className="flex gap-2">
                <Button
                  aria-label="Previous page"
                  variant="outline"
                  size="sm"
                  disabled={page === 1 || entities.isFetching}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  <FiChevronLeft aria-hidden="true" />
                </Button>
                <Button
                  aria-label="Next page"
                  variant="outline"
                  size="sm"
                  disabled={
                    !entities.data ||
                    page * entities.data.pageSize >= entities.data.total ||
                    entities.isFetching
                  }
                  onClick={() => setPage((value) => value + 1)}
                >
                  <FiChevronRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <aside
          className={`${styles.panel} min-h-[30rem] overflow-hidden`}
          aria-label="Entity details"
        >
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-[var(--ae-divider)] p-5">
                <div className="min-w-0">
                  <p className="text-xs capitalize text-[var(--ae-foreground-muted)]">
                    {entity.slice(0, -1)}
                  </p>
                  <h2 className="mt-1 truncate text-xl font-semibold">
                    {String(
                      selected.username ?? selected.deviceName ?? selected.id,
                    )}
                  </h2>
                  <p className="mt-1 truncate text-xs text-[var(--ae-foreground-muted)]">
                    ID: {selected.id}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    aria-label="Copy entity ID"
                    variant="ghost"
                    size="sm"
                    onClick={() => void copyText(selected.id, 'Entity ID')}
                  >
                    <FiCopy aria-hidden="true" />
                  </Button>
                  <Button
                    aria-label="Edit entity"
                    variant="ghost"
                    size="sm"
                    disabled={update.isPending || remove.isPending}
                    onClick={() => beginEdit(selected)}
                  >
                    <FiEdit2 aria-hidden="true" />
                  </Button>
                  <Button
                    aria-label="Delete entity"
                    variant="ghost"
                    size="sm"
                    disabled={update.isPending || remove.isPending}
                    className="text-[var(--ae-danger)] hover:bg-[var(--ae-danger-subtle)] hover:text-[var(--ae-danger)]"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <FiTrash2 aria-hidden="true" />
                  </Button>
                </div>
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
                    <dl className="mt-4 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
                      {Object.entries(selected)
                        .filter(([key]) => key !== 'metadata')
                        .map(([key, value]) => (
                          <div key={key} className="contents">
                            <dt className="text-[var(--ae-foreground-muted)]">
                              {labelFor(key)}
                            </dt>
                            <dd className="min-w-0 break-words text-[var(--ae-foreground)]">
                              {formatValue(value)}
                            </dd>
                          </div>
                        ))}
                    </dl>
                    {selected.metadata !== undefined ? (
                      <>
                        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                          <h3 className="font-semibold">Metadata (JSON)</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              void copyText(
                                JSON.stringify(selected.metadata, null, 2),
                                'Metadata',
                              )
                            }
                          >
                            <FiCopy aria-hidden="true" />
                            Copy
                          </Button>
                        </div>
                        <pre className={`${styles.json} mt-3 max-h-56 p-4`}>
                          {JSON.stringify(selected.metadata, null, 2)}
                        </pre>
                      </>
                    ) : null}
                    <h3 className="mt-5 font-semibold">Raw database record</h3>
                    <pre className={`${styles.json} mt-3 max-h-80 p-4`}>
                      {JSON.stringify(selected, null, 2)}
                    </pre>
                  </>
                )}
                {update.isError || remove.isError ? (
                  <p
                    role="alert"
                    className="mt-4 text-sm text-[var(--ae-danger-foreground)]"
                  >
                    The database operation failed. Check the values and your
                    permissions.
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex min-h-[30rem] flex-col items-center justify-center p-8 text-center text-[var(--ae-foreground-muted)]">
              <FiDatabase
                className="text-4xl text-[var(--ae-accent)]"
                aria-hidden="true"
              />
              <p className="mt-4">Select an entity record to inspect it.</p>
            </div>
          )}
        </aside>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border border-[var(--ae-danger-border)] bg-[var(--ae-surface-overlay)] text-[var(--ae-foreground)] shadow-[var(--ae-shadow-lg)]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this {entity.slice(0, -1)}?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-[var(--ae-foreground-muted)]">
              This action soft-deletes the record and may affect access to
              connected platform features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {remove.isError ? (
              <p
                role="alert"
                className="mr-auto text-sm text-[var(--ae-danger-foreground)]"
              >
                Deletion failed. Check your permissions and try again.
              </p>
            ) : null}
            <Button
              variant="outline"
              disabled={remove.isPending}
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={remove.isPending || !selected}
              onClick={() => selected && remove.mutate(selected.id)}
            >
              {remove.isPending ? 'Deleting…' : 'Delete record'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
        <Button
          type="button"
          aria-label="Cancel editing"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={onCancel}
        >
          <FiX aria-hidden="true" />
        </Button>
      </div>
      <div className="mt-5 space-y-4">
        {editableFields[entity].map((field) => (
          <label
            key={field}
            className="block text-xs font-medium text-[var(--ae-foreground-muted)]"
          >
            {labelFor(field)}
            {field === 'metadata' ? (
              <textarea
                rows={7}
                className={`${styles.control} mt-2 px-3 py-2 font-mono text-xs`}
                disabled={pending}
                value={JSON.stringify(draft[field] ?? {}, null, 2)}
                onChange={(event) => {
                  try {
                    setDraft({
                      ...draft,
                      [field]: JSON.parse(event.target.value),
                    });
                  } catch {
                    /* Retain the last valid JSON object. */
                  }
                }}
              />
            ) : (
              <input
                className={`${styles.control} mt-2 px-3 py-2`}
                disabled={pending}
                value={draft[field] == null ? '' : String(draft[field])}
                onChange={(event) =>
                  setDraft({ ...draft, [field]: event.target.value || null })
                }
              />
            )}
          </label>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
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
