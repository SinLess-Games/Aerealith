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

  const runs = runsQuery.data?.items ?? [];
  const succeededCount = runs.filter((run) => run.status === 'succeeded').length;
  const activeCount = runs.filter((run) => !isTerminal(run.status)).length;
  const failedCount = runs.filter(
    (run) => run.status === 'failed' || run.status === 'cancelled',
  ).length;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[var(--ae-border)] bg-[var(--ae-surface)] p-5 shadow-[var(--ae-shadow-sm)] sm:p-6">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[var(--ae-primary-subtle)] blur-3xl opacity-70" />
      <header className="relative flex flex-wrap items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] text-xl text-[var(--ae-primary)] shadow-[var(--ae-shadow-sm)]">
          <FiActivity aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ae-primary)]">
            Orchestration telemetry
          </p>
          <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Recent AI runs</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--ae-foreground-muted)]">
            Inspect durable orchestration state, selected models, failures,
            and completion timing across your AI workloads.
          </p>
        </div>
        <button
          type="button"
          disabled={runsQuery.isFetching}
          className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] px-4 text-sm font-semibold text-[var(--ae-foreground-muted)] transition-all hover:-translate-y-0.5 hover:border-[var(--ae-primary)] hover:text-[var(--ae-foreground)] disabled:translate-y-0 disabled:opacity-50"
          onClick={() => void runsQuery.refetch()}
        >
          <FiRefreshCw
            aria-hidden="true"
            className={runsQuery.isFetching ? 'animate-spin' : undefined}
          />
          Refresh
        </button>
      </header>

      <div className="relative mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <RunMetric label="Loaded runs" value={runs.length} detail="Latest orchestration history" />
        <RunMetric label="Succeeded" value={succeededCount} detail="Completed successfully" />
        <RunMetric label="Active" value={activeCount} detail="Queued or processing" />
        <RunMetric label="Failed / cancelled" value={failedCount} detail="Needs attention" />
      </div>

      {runsQuery.isError ? (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] p-3 text-sm text-[var(--ae-danger-foreground)]"
        >
          Unable to load AI run history.
        </div>
      ) : null}

      <div className="relative mt-6 overflow-hidden rounded-[22px] border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] shadow-[var(--ae-shadow-sm)]">
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
          runs.map((run) => <RunRow key={run.id} run={run} />)
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
    <article className="grid gap-3 border-b border-[var(--ae-border)] bg-[var(--ae-surface)] px-4 py-4 transition-colors last:border-b-0 hover:bg-[var(--ae-background-elevated)] md:grid-cols-[110px_120px_minmax(0,1fr)_180px_150px] md:items-center md:gap-4">
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

function RunMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] p-4 shadow-[var(--ae-shadow-sm)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ae-foreground-muted)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-[var(--ae-foreground)]">
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--ae-foreground-muted)]">
        {detail}
      </div>
    </div>
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
