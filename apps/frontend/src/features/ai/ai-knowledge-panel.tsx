import type { RunRecord } from '@aerealith-ai/ai-orchestration';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  FiBookOpen,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
} from 'react-icons/fi';

import { recordBrowserEvent } from '../../lib/browser-observability';

import {
  aiApi,
  runOutputJson,
  waitForAiRun,
} from './ai-client';

export function AiKnowledgePanel() {
  const queryClient = useQueryClient();
  const basesQuery = useQuery({
    queryKey: ['ai', 'knowledge-bases'],
    queryFn: () => aiApi.listKnowledgeBases(),
    staleTime: 15_000,
  });
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [lastRun, setLastRun] = useState<RunRecord>();

  const bases = basesQuery.data ?? [];

  useEffect(() => {
    if (!selectedId && bases[0]?.id) {
      setSelectedId(bases[0].id);
    }
  }, [bases, selectedId]);

  const selectedBase = useMemo(
    () => bases.find((item) => item.id === selectedId),
    [bases, selectedId],
  );

  const selectedQuery = useQuery({
    queryKey: ['ai', 'knowledge-base', selectedId],
    queryFn: () => aiApi.getKnowledgeBase(selectedId),
    enabled: Boolean(selectedId),
    staleTime: 10_000,
  });

  async function refreshKnowledge() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['ai', 'knowledge-bases'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['ai', 'knowledge-base'],
      }),
    ]);
  }

  async function createKnowledgeBase() {
    const value = name.trim();
    if (!value || pending) return;

    await runAction('knowledge-base-create', async () => {
      const created = await aiApi.createKnowledgeBase({
        name: value,
      });
      setName('');
      setSelectedId(created.id);
      await refreshKnowledge();
    });
  }

  async function ingestDocument() {
    if (
      !selectedId ||
      !documentId.trim() ||
      !documentText.trim() ||
      pending
    ) {
      return;
    }

    await runAction('knowledge-ingest', async () => {
      const accepted = await aiApi.ingestKnowledgeDocuments(
        selectedId,
        [
          {
            id: documentId.trim(),
            text: documentText,
          },
        ],
        {
          idempotencyKey: crypto.randomUUID(),
        },
      );

      setLastRun(accepted);
      const completed = await waitForAiRun(accepted);
      setLastRun(completed);

      if (completed.status !== 'succeeded') {
        throw new Error(
          completed.errorCode ??
            'Knowledge ingestion did not succeed.',
        );
      }

      setDocumentId('');
      setDocumentText('');
      await refreshKnowledge();
    });
  }

  async function deleteDocument(id: string) {
    if (!selectedId || pending) return;

    await runAction('knowledge-document-delete', async () => {
      await aiApi.deleteKnowledgeDocument(selectedId, id);
      await refreshKnowledge();
    });
  }

  async function searchKnowledge() {
    const query = searchQuery.trim();
    if (!selectedId || !query || pending) return;

    await runAction('knowledge-search', async () => {
      const accepted = await aiApi.createRun(
        {
          capability: 'retrieval',
          input: {
            namespace: selectedId,
            query,
            limit: 8,
            rerank: true,
          },
        },
        {
          idempotencyKey: crypto.randomUUID(),
        },
      );

      setLastRun(accepted);
      const completed = await waitForAiRun(accepted);
      setLastRun(completed);
    });
  }

  async function deleteBase() {
    if (!selectedId || pending) return;

    const id = selectedId;
    await runAction('knowledge-base-delete', async () => {
      await aiApi.deleteKnowledgeBase(id);
      setSelectedId('');
      setLastRun(undefined);
      await refreshKnowledge();
    });
  }

  async function runAction(
    actionName: string,
    action: () => Promise<void>,
  ) {
    setPending(true);
    setError(undefined);
    recordBrowserEvent('ai_knowledge_started', { action: actionName }, 'ai');

    try {
      await action();
      recordBrowserEvent('ai_knowledge_completed', { action: actionName }, 'ai');
    } catch (caught) {
      recordBrowserEvent('ai_knowledge_failed', { action: actionName }, 'ai');
      setError(
        caught instanceof Error
          ? caught.message
          : 'The knowledge operation failed.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[var(--ae-border)] bg-[var(--ae-surface)] p-5 shadow-[var(--ae-shadow-sm)] sm:p-6">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[var(--ae-primary-subtle)] blur-3xl opacity-70" />
      <header className="relative flex flex-wrap items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] text-xl text-[var(--ae-primary)] shadow-[var(--ae-shadow-sm)]">
          <FiBookOpen aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ae-primary)]">
            Retrieval workspace
          </p>
          <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Knowledge bases</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--ae-foreground-muted)]">
            Store tenant-isolated documents in Qdrant, then retrieve and
            rerank them through the same AI orchestration API.
          </p>
        </div>
        <button
          type="button"
          className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] px-4 text-sm font-semibold text-[var(--ae-foreground-muted)] transition-all hover:-translate-y-0.5 hover:border-[var(--ae-primary)] hover:text-[var(--ae-foreground)]"
          onClick={() => void refreshKnowledge()}
        >
          <FiRefreshCw aria-hidden="true" />
          Refresh
        </button>
      </header>

      {error ? (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] p-3 text-sm text-[var(--ae-danger-foreground)]"
        >
          {error}
        </div>
      ) : null}

      <div className="relative mt-7 grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-[22px] border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] p-4 shadow-[var(--ae-shadow-sm)]">
            <label className="block">
              <span className={labelClass}>New knowledge base</span>
              <input
                value={name}
                disabled={pending}
                placeholder="Product documentation"
                className={inputClass}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={pending || !name.trim()}
              className={primaryButtonClass}
              onClick={() => void createKnowledgeBase()}
            >
              <FiPlus aria-hidden="true" />
              Create
            </button>
          </div>

          <div className="space-y-2">
            {basesQuery.isPending ? (
              <p className="text-sm text-[var(--ae-foreground-muted)]">
                Loading knowledge bases…
              </p>
            ) : bases.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--ae-border)] p-4 text-sm text-[var(--ae-foreground-muted)]">
                No knowledge bases yet.
              </p>
            ) : (
              bases.map((base) => (
                <button
                  key={base.id}
                  type="button"
                  className={[
                    'w-full rounded-2xl border p-4 text-left transition-all duration-200',
                    base.id === selectedId
                      ? 'border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] shadow-[var(--ae-shadow-sm)]'
                      : 'border-[var(--ae-border)] bg-[var(--ae-background-elevated)] hover:-translate-y-0.5 hover:border-[var(--ae-primary)] hover:shadow-[var(--ae-shadow-sm)]',
                  ].join(' ')}
                  onClick={() => {
                    setSelectedId(base.id);
                    setLastRun(undefined);
                  }}
                >
                  <div className="truncate text-sm font-semibold">
                    {base.name}
                  </div>
                  <div className="mt-1 text-xs text-[var(--ae-foreground-muted)]">
                    {base.documentCount} documents
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          {selectedBase ? (
            <>
              <section className="rounded-[22px] border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] p-5 shadow-[var(--ae-shadow-sm)]">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedBase.name}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] text-[var(--ae-foreground-muted)]">
                      {selectedBase.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] px-3 text-sm font-semibold text-[var(--ae-danger)] disabled:opacity-50"
                    onClick={() => void deleteBase()}
                  >
                    <FiTrash2 aria-hidden="true" />
                    Delete base
                  </button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                  <label>
                    <span className={labelClass}>Document ID</span>
                    <input
                      value={documentId}
                      disabled={pending}
                      placeholder="architecture-v1"
                      className={inputClass}
                      onChange={(event) =>
                        setDocumentId(event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <span className={labelClass}>Document text</span>
                    <textarea
                      value={documentText}
                      disabled={pending}
                      rows={7}
                      placeholder="Paste the text to index…"
                      className={textareaClass}
                      onChange={(event) =>
                        setDocumentText(event.target.value)
                      }
                    />
                  </label>
                </div>

                <button
                  type="button"
                  disabled={
                    pending ||
                    !documentId.trim() ||
                    !documentText.trim()
                  }
                  className={primaryButtonClass}
                  onClick={() => void ingestDocument()}
                >
                  <FiUploadCloud aria-hidden="true" />
                  {pending ? 'Working…' : 'Ingest document'}
                </button>
              </section>

              <section className="rounded-[22px] border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] p-5 shadow-[var(--ae-shadow-sm)]">
                <h3 className="font-semibold">Documents</h3>
                <div className="mt-3 space-y-2">
                  {selectedQuery.isPending ? (
                    <p className="text-sm text-[var(--ae-foreground-muted)]">
                      Loading documents…
                    </p>
                  ) : (selectedQuery.data?.documents.length ?? 0) === 0 ? (
                    <p className="text-sm text-[var(--ae-foreground-muted)]">
                      This knowledge base is empty.
                    </p>
                  ) : (
                    selectedQuery.data?.documents.map((document) => (
                      <div
                        key={document.id}
                        className="flex items-center gap-3 rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface)] px-4 py-3 transition-colors hover:border-[var(--ae-primary)]"
                      >
                        <span className="min-w-0 flex-1 truncate font-mono text-xs">
                          {document.id}
                        </span>
                        <button
                          type="button"
                          disabled={pending}
                          aria-label={'Delete ' + document.id}
                          className="rounded-lg p-2 text-[var(--ae-danger)] hover:bg-[var(--ae-danger-subtle)]"
                          onClick={() =>
                            void deleteDocument(document.id)
                          }
                        >
                          <FiTrash2 aria-hidden="true" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-[22px] border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] p-5 shadow-[var(--ae-shadow-sm)]">
                <h3 className="font-semibold">Search this knowledge base</h3>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={searchQuery}
                    disabled={pending}
                    placeholder="What do the docs say about…?"
                    className={inputClass + ' mt-0 flex-1'}
                    onChange={(event) =>
                      setSearchQuery(event.target.value)
                    }
                  />
                  <button
                    type="button"
                    disabled={pending || !searchQuery.trim()}
                    className={primaryButtonClass + ' mt-0'}
                    onClick={() => void searchKnowledge()}
                  >
                    <FiSearch aria-hidden="true" />
                    Search
                  </button>
                </div>

                {lastRun ? (
                  <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--ae-border)] bg-[var(--ae-surface)] p-4 text-xs leading-relaxed">
                    {runOutputJson(lastRun)}
                  </pre>
                ) : null}
              </section>
            </>
          ) : (
            <div className="relative flex min-h-80 overflow-hidden rounded-[24px] border border-dashed border-[var(--ae-border)] bg-[var(--ae-background-elevated)] p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--ae-primary-subtle),transparent_52%)] opacity-70" />
              <div className="relative m-auto max-w-sm text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-surface)] text-xl text-[var(--ae-primary)]">
                  <FiBookOpen aria-hidden="true" />
                </div>
                <p className="mt-4 font-semibold text-[var(--ae-foreground)]">Build a private knowledge layer</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ae-foreground-muted)]">
                  Create or select a knowledge base, ingest documents, then search them with retrieval and reranking.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const labelClass =
  'text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ae-foreground-muted)]';

const inputClass =
  'mt-2 min-h-12 w-full rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface)] px-4 text-sm outline-none transition-all placeholder:text-[var(--ae-foreground-muted)] focus:border-[var(--ae-primary)] focus:ring-4 focus:ring-[var(--ae-primary-subtle)] disabled:opacity-60';

const textareaClass =
  'mt-2 w-full resize-y rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-surface)] px-4 py-3.5 text-sm leading-relaxed outline-none transition-all placeholder:text-[var(--ae-foreground-muted)] focus:border-[var(--ae-primary)] focus:ring-4 focus:ring-[var(--ae-primary-subtle)] disabled:opacity-60';

const primaryButtonClass =
  'mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--ae-primary)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--ae-shadow-sm)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40';
