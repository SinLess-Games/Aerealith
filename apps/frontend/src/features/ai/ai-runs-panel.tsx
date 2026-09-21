import type { RunRecord } from '@aerealith-ai/ai-orchestration';
import { useQuery } from '@tanstack/react-query';
import {
  FiActivity,
  FiRefreshCw,
  FiXCircle,
} from 'react-icons/fi';

import { aiApi } from './ai-client';

export function AiRunsPanel() {
  const runsQuery = useQuery({
    queryKey: ['ai', 'runs'],
    queryFn: () => aiApi.listRuns({ limit: 50 }),
    staleTime: 5_000,
    refetchInterval: 10_000,
  });

  return (
    <section className="rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-5 shadow-[var(--ae-shadow-sm)] sm:p-6">
      <header className="flex flex-wrap items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] text-xl text-[var(--ae-primary)]">
          <FiActivity aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Recent AI runs</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--ae-foreground-muted)]">
            Inspect durable orchestration state, selected models, failures,
            and completion timing across your AI workloads.
          </p>
        </div>
        <button
          type="button"
          disabled={runsQuery.isFetching}
          className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--ae-border)] px-3 text-sm font-semibold text-[var(--ae-foreground-muted)] disabled:opacity-50"
          onClick={() => void runsQuery.refetch()}
        >
          <FiRefreshCw aria-hidden="true" />
          Refresh
        </button>
      </header>

      {runsQuery.isError ? (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] p-3 text-sm text-[var(--ae-danger-foreground)]"
        >
          Unable to load AI run history.
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-[var(--ae-border)]">
        <div className="hidden grid-cols-[110px_120px_minmax(0,1fr)_180px_150px] gap-4 border-b border-[var(--ae-border)] bg-[var(--ae-background-elevated)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ae-foreground-muted)] md:grid">
          <span>Status</span>
          <span>Capability</span>
          <span>Model</span>
          <span>Updated</span>
          <span>Run</span>
        </div>

        {runsQuery.isPending ? (
          <p className="p-6 text-sm text-[var(--ae-foreground-muted)]">
            Loading run history…
          </p>
        ) : (runsQuery.data?.items.length ?? 0) === 0 ? (
          <p className="p-6 text-sm text-[var(--ae-foreground-muted)]">
            No AI runs yet.
          </p>
        ) : (
          runsQuery.data?.items.map((run) => (
            <RunRow key={run.id} run={run} />
          ))
        )}
      </div>
    </section>
  );
}

function RunRow({
  run,
}: {
  run: Omit<RunRecord, 'output'>;
}) {
  return (
    <article className="grid gap-3 border-b border-[var(--ae-border)] px-4 py-4 last:border-b-0 md:grid-cols-[110px_120px_minmax(0,1fr)_180px_150px] md:items-center md:gap-4">
      <div>
        <span className="md:hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ae-foreground-muted)]">
          Status
        </span>
        <div className="mt-1 md:mt-0">
          <RunStatus status={run.status} />
        </div>
      </div>

      <div>
        <span className="md:hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ae-foreground-muted)]">
          Capability
        </span>
        <div className="mt-1 text-sm font-semibold capitalize md:mt-0">
          {run.capability}
        </div>
      </div>

      <div className="min-w-0">
        <span className="md:hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ae-foreground-muted)]">
          Model
        </span>
        <div className="mt-1 truncate text-xs text-[var(--ae-foreground-muted)] md:mt-0">
          {run.modelId ?? 'Routing pending'}
        </div>
      </div>

      <div>
        <span className="md:hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ae-foreground-muted)]">
          Updated
        </span>
        <time
          className="mt-1 block text-xs text-[var(--ae-foreground-muted)] md:mt-0"
          dateTime={run.updatedAt}
        >
          {formatDate(run.updatedAt)}
        </time>
      </div>

      <div className="flex items-center gap-2">
        <code className="text-[11px] text-[var(--ae-foreground-muted)]">
          {run.id.slice(0, 12)}
        </code>
        {!isTerminal(run.status) ? (
          <button
            type="button"
            aria-label={'Cancel run ' + run.id}
            title="Cancel run"
            className="ml-auto rounded-lg p-2 text-[var(--ae-danger)] hover:bg-[var(--ae-danger-subtle)]"
            onClick={() => void aiApi.cancelRun(run.id)}
          >
            <FiXCircle aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function RunStatus({ status }: { status: RunRecord['status'] }) {
  const className =
    status === 'succeeded'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
      : status === 'failed' || status === 'cancelled'
        ? 'border-red-500/40 bg-red-500/10 text-red-500'
        : 'border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] text-[var(--ae-primary)]';

  return (
    <span
      className={
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ' +
        className
      }
    >
      {status}
    </span>
  );
}

function isTerminal(status: RunRecord['status']): boolean {
  return (
    status === 'succeeded' ||
    status === 'failed' ||
    status === 'cancelled'
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

export default AiRunsPanel;
