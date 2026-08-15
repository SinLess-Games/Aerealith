import { useMemo, useState, type ReactNode } from 'react';
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
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';

import {
  createEntity,
  deleteEntity,
  fetchEntities,
  fetchEntityCatalog,
  updateEntity,
  type CreateUserEntityInput,
  type EntityColumn,
  type EntityDefinition,
  type EntityRecord,
  type EntityType,
} from '../../../features/admin/entity-api';
import { ApiError } from '../../../lib/api-client';
import styles from './entity-viewer.module.css';

const editableFields: Record<string, readonly string[]> = {
  users: ['username', 'email', 'status', 'tier', 'metadata'],
  user_sessions: ['deviceName', 'revokedAt'],
};

export function EntityViewerRoute() {
  const queryClient = useQueryClient();
  const [entity, setEntity] = useState<EntityType>('users');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const catalog = useQuery({
    queryKey: ['admin', 'entity-catalog'],
    queryFn: fetchEntityCatalog,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const definition = catalog.data?.find((item) => item.name === entity);
  const entities = useQuery({
    queryKey: ['admin', 'entities', entity, search, page],
    queryFn: () => fetchEntities(entity, search, page),
    enabled: Boolean(definition),
    retry: false,
  });
  const selected = useMemo(
    () =>
      entities.data?.records.find((record) => record.id === selectedId) ??
      entities.data?.records[0],
    [entities.data, selectedId],
  );
  const columns = useMemo(
    () => columnsFor(definition, entities.data?.records[0]),
    [definition, entities.data?.records],
  );
  const singularLabel = definition?.singularLabel ?? 'Record';

  const update = useMutation({
    mutationFn: (input: {
      entity: EntityType;
      id: string;
      changes: Record<string, unknown>;
    }) => updateEntity(input.entity, input.id, input.changes),
    onSuccess: async (record, variables) => {
      setEditing(false);
      setSelectedId(record.id);
      setAnnouncement(
        `${labelForEntity(catalog.data, variables.entity)} updated successfully.`,
      );
      await queryClient.invalidateQueries({ queryKey: ['admin', 'entities'] });
    },
    onError: () => setAnnouncement('The update could not be completed.'),
  });
  const create = useMutation({
    mutationFn: (input: {
      entity: EntityType;
      values: Record<string, unknown> | CreateUserEntityInput;
    }) => createEntity(input.entity, input.values),
    onSuccess: async (record, variables) => {
      setCreating(false);
      setSelectedId(record.id);
      setAnnouncement(
        `${labelForEntity(catalog.data, variables.entity)} created successfully.`,
      );
      await queryClient.invalidateQueries({ queryKey: ['admin', 'entities'] });
    },
    onError: () => setAnnouncement('The record could not be created.'),
  });
  const remove = useMutation({
    mutationFn: (input: { entity: EntityType; id: string }) =>
      deleteEntity(input.entity, input.id),
    onSuccess: async (_result, variables) => {
      setSelectedId(undefined);
      setDeleteDialogOpen(false);
      setAnnouncement(
        `${labelForEntity(catalog.data, variables.entity)} deleted successfully.`,
      );
      await queryClient.invalidateQueries({ queryKey: ['admin', 'entities'] });
    },
    onError: () => setAnnouncement('The record could not be deleted.'),
  });

  const selectEntity = (next: EntityType) => {
    setEntity(next);
    setPage(1);
    setSearch('');
    setSearchInput('');
    setSelectedId(undefined);
    setCreating(false);
    setEditing(false);
    setDeleteDialogOpen(false);
    setAnnouncement('');
  };

  const beginEdit = (record: EntityRecord) => {
    setCreating(false);
    setDraft(
      Object.fromEntries(
        (editableFields[entity] ?? []).map((field) => [field, record[field]]),
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
            View every database entity and add records from its live schema.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {definition?.canCreate ? (
            <Button
              onClick={() => {
                setCreating(true);
                setEditing(false);
                setDeleteDialogOpen(false);
                setAnnouncement(
                  `Add ${singularLabel.toLowerCase()} form opened.`,
                );
                create.reset();
              }}
              disabled={create.isPending}
            >
              <FiPlus aria-hidden="true" />
              Add {singularLabel.toLowerCase()}
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => void entities.refetch()}
            disabled={entities.isFetching || !definition}
          >
            <FiRefreshCw
              className={entities.isFetching ? 'animate-spin' : undefined}
              aria-hidden="true"
            />
            {entities.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(20rem,.88fr)]">
        <div className={`${styles.panel} p-3`}>
          <div className="grid gap-3 sm:grid-cols-[minmax(12rem,220px)_minmax(0,1fr)]">
            <label className="sr-only" htmlFor="entity-type">
              Entity type
            </label>
            <select
              id="entity-type"
              value={entity}
              onChange={(event) => selectEntity(event.target.value)}
              className={`${styles.control} px-3 py-2.5`}
              disabled={catalog.isLoading}
            >
              {catalog.data?.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.label}
                </option>
              ))}
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
                Search {definition?.label ?? entity}
              </label>
              <input
                id="entity-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className={`${styles.control} py-2.5 pl-10 pr-4`}
                placeholder={`Search ${definition?.label.toLowerCase() ?? entity} across visible fields…`}
              />
            </form>
          </div>
          <p className="mt-3 text-xs text-[var(--ae-foreground-muted)]">
            Sensitive credential and location fields are always redacted.
          </p>
        </div>
        <div
          className={`${styles.panel} flex items-center p-3 text-sm text-[var(--ae-foreground-muted)]`}
        >
          <span>
            {catalog.isLoading
              ? 'Loading database catalog…'
              : `${catalog.data?.length ?? 0} entity types available`}
          </span>
        </div>
      </div>

      {catalog.isError ? (
        <div role="alert" className={`${styles.error} mt-4`}>
          The database entity catalog could not be loaded.
        </div>
      ) : null}

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
                    {columns.map((column) => (
                      <th key={column} className="px-4 py-3 font-medium">
                        {columnLabel(definition, column)}
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
                <tbody aria-busy={entities.isLoading || catalog.isLoading}>
                  {entities.isLoading || catalog.isLoading ? (
                    <tr>
                      <td
                        colSpan={columns.length + 1}
                        className="px-4 py-10 text-center text-[var(--ae-foreground-muted)]"
                      >
                        Loading {definition?.label.toLowerCase() ?? entity}…
                      </td>
                    </tr>
                  ) : null}
                  {entities.data?.records.map((record) => (
                    <tr
                      key={record.id}
                      className={`${styles.row} ${record.id === selected?.id ? styles.selected : ''}`}
                    >
                      {columns.map((column) => (
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
                          aria-label={`Inspect ${singularLabel.toLowerCase()} ${recordTitle(record)}`}
                          className={styles.inspectButton}
                          onClick={() => {
                            setCreating(false);
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
                        colSpan={columns.length + 1}
                        className="px-4 py-10 text-center text-[var(--ae-foreground-muted)]"
                      >
                        No {definition?.label.toLowerCase() ?? entity} match
                        this search.
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
          {creating && definition ? (
            entity === 'users' ? (
              <CreateUserForm
                pending={create.isPending}
                error={createError(create.error)}
                onCancel={() => {
                  setCreating(false);
                  create.reset();
                }}
                onCreate={(values) => create.mutate({ entity, values })}
              />
            ) : (
              <CreateEntityForm
                definition={definition}
                pending={create.isPending}
                error={createError(create.error)}
                onCancel={() => {
                  setCreating(false);
                  create.reset();
                }}
                onCreate={(values) => create.mutate({ entity, values })}
              />
            )
          ) : selected ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-[var(--ae-divider)] p-5">
                <div className="min-w-0">
                  <p className="text-xs text-[var(--ae-foreground-muted)]">
                    {singularLabel}
                  </p>
                  <h2 className="mt-1 truncate text-xl font-semibold">
                    {recordTitle(selected)}
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
                  {definition?.canUpdate ? (
                    <Button
                      aria-label="Edit entity"
                      variant="ghost"
                      size="sm"
                      disabled={update.isPending || remove.isPending}
                      onClick={() => beginEdit(selected)}
                    >
                      <FiEdit2 aria-hidden="true" />
                    </Button>
                  ) : null}
                  {definition?.canDelete ? (
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
                  ) : null}
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
                      update.mutate({ entity, id: selected.id, changes: draft })
                    }
                  />
                ) : (
                  <RecordDetails
                    record={selected}
                    definition={definition}
                    onCopy={copyText}
                  />
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
              Delete this {singularLabel.toLowerCase()}?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-[var(--ae-foreground-muted)]">
              This action may affect access to connected platform features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
              onClick={() =>
                selected && remove.mutate({ entity, id: selected.id })
              }
            >
              {remove.isPending ? 'Deleting…' : 'Delete record'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function RecordDetails({
  record,
  definition,
  onCopy,
}: {
  record: EntityRecord;
  definition?: EntityDefinition;
  onCopy: (value: string, label: string) => Promise<void>;
}) {
  return (
    <>
      <h3 className="font-semibold">Record overview</h3>
      <dl className="mt-4 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
        {Object.entries(record)
          .filter(([key]) => key !== 'metadata')
          .map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-[var(--ae-foreground-muted)]">
                {columnLabel(definition, key)}
              </dt>
              <dd className="min-w-0 break-words text-[var(--ae-foreground)]">
                {formatValue(value)}
              </dd>
            </div>
          ))}
      </dl>
      {record.metadata !== undefined ? (
        <>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">Metadata (JSON)</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                void onCopy(
                  JSON.stringify(record.metadata, null, 2),
                  'Metadata',
                )
              }
            >
              <FiCopy aria-hidden="true" />
              Copy
            </Button>
          </div>
          <pre className={`${styles.json} mt-3 max-h-56 p-4`}>
            {JSON.stringify(record.metadata, null, 2)}
          </pre>
        </>
      ) : null}
      <h3 className="mt-5 font-semibold">Raw database record</h3>
      <pre className={`${styles.json} mt-3 max-h-80 p-4`}>
        {JSON.stringify(record, null, 2)}
      </pre>
    </>
  );
}

const UserStatusOptions = ['active', 'disabled', 'suspended'] as const;
const UserTierOptions = [
  'basic',
  'basic_plus',
  'premium',
  'premium_plus',
  'pro',
  'pro_plus',
] as const;

function CreateUserForm({
  pending,
  error,
  onCancel,
  onCreate,
}: {
  pending: boolean;
  error?: string;
  onCancel: () => void;
  onCreate: (input: CreateUserEntityInput) => void;
}) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] =
    useState<CreateUserEntityInput['status']>('active');
  const [tier, setTier] = useState<CreateUserEntityInput['tier']>('basic');
  const [emailVerified, setEmailVerified] = useState(false);
  const [metadataText, setMetadataText] = useState('{}');
  const [metadataError, setMetadataError] = useState('');

  return (
    <EntityCreateShell
      label="User"
      pending={pending}
      error={error}
      onCancel={onCancel}
      submitLabel="Create user"
      onSubmit={() => {
        let metadata: unknown;
        try {
          metadata = JSON.parse(metadataText);
        } catch {
          setMetadataError('Metadata must be valid JSON.');
          return;
        }
        if (
          typeof metadata !== 'object' ||
          metadata === null ||
          Array.isArray(metadata)
        ) {
          setMetadataError('Metadata must be a JSON object.');
          return;
        }
        setMetadataError('');
        onCreate({
          username,
          email,
          password,
          ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
          status,
          tier,
          emailVerified,
          metadata: metadata as Record<string, unknown>,
        });
      }}
    >
      <p className="text-sm text-[var(--ae-foreground-muted)]">
        Create a login-ready account. Unverified users receive an email
        verification link.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <EntityTextField
          label="Username"
          value={username}
          autoComplete="off"
          required
          pending={pending}
          onChange={setUsername}
        />
        <EntityTextField
          label="Email address"
          type="email"
          value={email}
          autoComplete="off"
          required
          pending={pending}
          onChange={setEmail}
        />
        <EntityTextField
          label="Display name"
          value={displayName}
          autoComplete="off"
          pending={pending}
          onChange={setDisplayName}
        />
        <EntityTextField
          label="Temporary password"
          type="password"
          value={password}
          autoComplete="new-password"
          required
          pending={pending}
          onChange={setPassword}
        />
        <EntitySelectField
          label="Status"
          value={status}
          options={UserStatusOptions}
          pending={pending}
          onChange={(value) =>
            setStatus(value as CreateUserEntityInput['status'])
          }
        />
        <EntitySelectField
          label="Tier"
          value={tier}
          options={UserTierOptions}
          pending={pending}
          onChange={(value) => setTier(value as CreateUserEntityInput['tier'])}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--ae-foreground-subtle)]">
        Passwords require 12–128 characters with uppercase, lowercase, and a
        number.
      </p>
      <label className="mt-5 flex items-start gap-3 text-sm text-[var(--ae-foreground-muted)]">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-[var(--ae-accent)]"
          checked={emailVerified}
          disabled={pending}
          onChange={(event) => setEmailVerified(event.target.checked)}
        />
        Mark this email address as already verified
      </label>
      <label className="mt-5 block text-xs font-medium text-[var(--ae-foreground-muted)]">
        Metadata (JSON)
        <textarea
          rows={6}
          className={`${styles.control} mt-2 px-3 py-2 font-mono text-xs`}
          value={metadataText}
          disabled={pending}
          aria-invalid={Boolean(metadataError)}
          onChange={(event) => {
            setMetadataText(event.target.value);
            setMetadataError('');
          }}
        />
      </label>
      {metadataError ? (
        <p role="alert" className="mt-2 text-sm text-[var(--ae-danger)]">
          {metadataError}
        </p>
      ) : null}
    </EntityCreateShell>
  );
}

function CreateEntityForm({
  definition,
  pending,
  error,
  onCancel,
  onCreate,
}: {
  definition: EntityDefinition;
  pending: boolean;
  error?: string;
  onCancel: () => void;
  onCreate: (input: Record<string, unknown>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState('');
  const columns = definition.columns.filter((column) => column.insertable);

  return (
    <EntityCreateShell
      label={definition.singularLabel}
      pending={pending}
      error={error}
      onCancel={onCancel}
      submitLabel={`Create ${definition.singularLabel.toLowerCase()}`}
      onSubmit={() => {
        try {
          setValidationError('');
          onCreate(parseEntityValues(columns, values));
        } catch (submissionError) {
          setValidationError(
            submissionError instanceof Error
              ? submissionError.message
              : 'One or more values are invalid.',
          );
        }
      }}
    >
      <p className="text-sm text-[var(--ae-foreground-muted)]">
        Fields are generated from the live database schema. Optional blank
        fields use their database default.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {columns.map((column) => (
          <SchemaField
            key={column.key}
            column={column}
            value={values[column.key] ?? ''}
            pending={pending}
            onChange={(value) =>
              setValues((current) => ({ ...current, [column.key]: value }))
            }
          />
        ))}
      </div>
      {validationError ? (
        <p role="alert" className="mt-4 text-sm text-[var(--ae-danger)]">
          {validationError}
        </p>
      ) : null}
    </EntityCreateShell>
  );
}

function EntityCreateShell({
  label,
  pending,
  error,
  onCancel,
  onSubmit,
  submitLabel,
  children,
}: {
  label: string;
  pending: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-[var(--ae-divider)] p-5">
        <div>
          <p className="text-xs text-[var(--ae-foreground-muted)]">{label}</p>
          <h2 className="mt-1 text-xl font-semibold">
            Add new {label.toLowerCase()}
          </h2>
        </div>
        <Button
          type="button"
          aria-label={`Close create ${label.toLowerCase()} form`}
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={onCancel}
        >
          <FiX aria-hidden="true" />
        </Button>
      </div>
      <form
        className="p-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {children}
        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] p-3 text-sm text-[var(--ae-danger-foreground)]"
          >
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Creating…' : submitLabel}
          </Button>
        </div>
      </form>
    </>
  );
}

function SchemaField({
  column,
  value,
  pending,
  onChange,
}: {
  column: EntityColumn;
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
}) {
  const label = `${column.label}${column.required ? ' *' : ''}`;
  if (column.enumValues?.length) {
    return (
      <label className="block text-xs font-medium text-[var(--ae-foreground-muted)]">
        {label}
        <select
          className={`${styles.control} mt-2 px-3 py-2`}
          value={value}
          required={column.required}
          disabled={pending}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="" disabled={column.required}>
            {column.required ? 'Select a value' : 'Use database default'}
          </option>
          {column.enumValues.map((option) => (
            <option key={option} value={option}>
              {labelFor(option.replaceAll('_', ' '))}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (column.type === 'boolean') {
    return (
      <label className="block text-xs font-medium text-[var(--ae-foreground-muted)]">
        {label}
        <select
          className={`${styles.control} mt-2 px-3 py-2`}
          value={value}
          required={column.required}
          disabled={pending}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="" disabled={column.required}>
            {column.required ? 'Select a value' : 'Use database default'}
          </option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </label>
    );
  }
  if (column.type === 'json' || column.type === 'array') {
    return (
      <label className="block text-xs font-medium text-[var(--ae-foreground-muted)] sm:col-span-2">
        {label} (JSON)
        <textarea
          rows={4}
          className={`${styles.control} mt-2 px-3 py-2 font-mono text-xs`}
          value={value}
          required={column.required}
          disabled={pending}
          placeholder={column.type === 'array' ? '[]' : '{}'}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }
  return (
    <EntityTextField
      label={`${label}${column.sensitive ? ' (stored value is redacted)' : ''}`}
      value={value}
      type={
        column.sensitive
          ? 'password'
          : column.type === 'date'
            ? 'datetime-local'
            : column.type === 'number' || column.type === 'bigint'
              ? 'number'
              : column.key === 'email'
                ? 'email'
                : 'text'
      }
      autoComplete={column.sensitive ? 'new-password' : 'off'}
      required={column.required}
      pending={pending}
      onChange={onChange}
    />
  );
}

function EntityTextField({
  label,
  value,
  pending,
  onChange,
  type = 'text',
  autoComplete,
  required = false,
}: {
  label: string;
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-medium text-[var(--ae-foreground-muted)]">
      {label}
      <input
        className={`${styles.control} mt-2 px-3 py-2`}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        disabled={pending}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function EntitySelectField({
  label,
  value,
  options,
  pending,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  pending: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-medium text-[var(--ae-foreground-muted)]">
      {label}
      <select
        className={`${styles.control} mt-2 px-3 py-2`}
        value={value}
        disabled={pending}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labelFor(option.replaceAll('_', ' '))}
          </option>
        ))}
      </select>
    </label>
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
        {(editableFields[entity] ?? []).map((field) => (
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
                    // Keep the last valid JSON value while the user is typing.
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
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

function parseEntityValues(
  columns: readonly EntityColumn[],
  rawValues: Record<string, string>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const column of columns) {
    const rawValue = rawValues[column.key]?.trim() ?? '';
    if (!rawValue) {
      if (column.required) throw new Error(`${column.label} is required.`);
      continue;
    }
    if (column.type === 'boolean') values[column.key] = rawValue === 'true';
    else if (column.type === 'number') values[column.key] = Number(rawValue);
    else if (column.type === 'date')
      values[column.key] = new Date(rawValue).toISOString();
    else if (column.type === 'json' || column.type === 'array') {
      try {
        values[column.key] = JSON.parse(rawValue);
      } catch {
        throw new Error(`${column.label} must contain valid JSON.`);
      }
      if (column.type === 'array' && !Array.isArray(values[column.key])) {
        throw new Error(`${column.label} must be a JSON array.`);
      }
    } else values[column.key] = rawValue;
  }
  return values;
}

function columnsFor(
  definition: EntityDefinition | undefined,
  record: EntityRecord | undefined,
): string[] {
  const schemaColumns = definition?.columns
    .filter((column) => !column.sensitive)
    .map((column) => column.key);
  const available = schemaColumns?.filter(
    (column) => column === 'id' || record?.[column] !== undefined,
  );
  return (available?.length ? available : Object.keys(record ?? {})).slice(
    0,
    6,
  );
}

function columnLabel(definition: EntityDefinition | undefined, key: string) {
  return (
    definition?.columns.find((column) => column.key === key)?.label ??
    labelFor(key)
  );
}

function labelForEntity(
  definitions: readonly EntityDefinition[] | undefined,
  entity: string,
) {
  return (
    definitions?.find((item) => item.name === entity)?.singularLabel ??
    labelFor(entity.replaceAll('_', ' ')).replace(/s$/, '')
  );
}

function recordTitle(record: EntityRecord): string {
  return String(
    record['username'] ??
      record['email'] ??
      record['name'] ??
      record['slug'] ??
      record['deviceName'] ??
      record.id,
  );
}

function createError(error: unknown): string | undefined {
  if (!error) return undefined;
  return error instanceof ApiError
    ? error.message
    : 'The record could not be created. Check the values and try again.';
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
