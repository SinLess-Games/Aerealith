import { FeatureFlag } from '@aerealith-ai/core';
import type { CapabilityKind } from '@aerealith-ai/ai-orchestration';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiBarChart2,
  FiBookOpen,
  FiBox,
  FiCode,
  FiCpu,
  FiImage,
  FiMessageSquare,
  FiTool,
  FiZap,
} from 'react-icons/fi';

import { useFeatureFlags } from '../flags/feature-flags';
import { aiApi } from './ai-client';
import {
  AiAnalyzePanel,
  AiCodePanel,
  AiMediaPanel,
  AiToolsPanel,
} from './ai-task-panels';
import { AiChatPanel } from './ai-chat-panel';
import { AiKnowledgePanel } from './ai-knowledge-panel';
import { AiRunsPanel } from './ai-runs-panel';

type AiStudioTab =
  | 'chat'
  | 'code'
  | 'media'
  | 'analyze'
  | 'knowledge'
  | 'tools'
  | 'runs';

type TabDefinition = {
  id: AiStudioTab;
  label: string;
  icon: typeof FiCpu;
  enabled: boolean;
};

export function AiStudio() {
  const flags = useFeatureFlags();
  const capabilitiesQuery = useQuery({
    queryKey: ['ai', 'capabilities'],
    queryFn: () => aiApi.capabilities(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const modelsQuery = useQuery({
    queryKey: ['ai', 'models'],
    queryFn: () => aiApi.models(),
    staleTime: 60_000,
  });
  const usageQuery = useQuery({
    queryKey: ['ai', 'usage'],
    queryFn: () => aiApi.usage(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const executable = useMemo(
    () => new Set(capabilitiesQuery.data?.executable ?? []),
    [capabilitiesQuery.data?.executable],
  );

  const mediaCapabilities = useMemo(
    () =>
      [
        flags[FeatureFlag.AiImage] && executable.has('image')
          ? 'image'
          : undefined,
        flags[FeatureFlag.AiAudio] && executable.has('audio')
          ? 'audio'
          : undefined,
        flags[FeatureFlag.AiVideo] && executable.has('video')
          ? 'video'
          : undefined,
        flags[FeatureFlag.AiMusic] && executable.has('music')
          ? 'music'
          : undefined,
      ].filter(
        (value): value is Extract<
          CapabilityKind,
          'image' | 'audio' | 'video' | 'music'
        > => Boolean(value),
      ),
    [executable, flags],
  );

  const analysisCapabilities = useMemo(
    () =>
      [
        flags[FeatureFlag.AiAnalytics] && executable.has('analytics')
          ? 'analytics'
          : undefined,
        flags[FeatureFlag.AiPrediction] && executable.has('prediction')
          ? 'prediction'
          : undefined,
      ].filter(
        (value): value is Extract<
          CapabilityKind,
          'analytics' | 'prediction'
        > => Boolean(value),
      ),
    [executable, flags],
  );

  const tabs = useMemo<readonly TabDefinition[]>(
    () => [
      {
        id: 'chat',
        label: 'Chat',
        icon: FiMessageSquare,
        enabled:
          flags[FeatureFlag.AiChat] && executable.has('text'),
      },
      {
        id: 'code',
        label: 'Code',
        icon: FiCode,
        enabled:
          flags[FeatureFlag.AiCode] && executable.has('code'),
      },
      {
        id: 'media',
        label: 'Media',
        icon: FiImage,
        enabled: mediaCapabilities.length > 0,
      },
      {
        id: 'analyze',
        label: 'Analyze',
        icon: FiBarChart2,
        enabled: analysisCapabilities.length > 0,
      },
      {
        id: 'knowledge',
        label: 'Knowledge',
        icon: FiBookOpen,
        enabled:
          flags[FeatureFlag.AiKnowledge] &&
          (executable.has('knowledge-ingest') ||
            executable.has('retrieval')),
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: FiTool,
        enabled:
          flags[FeatureFlag.AiTools] && executable.has('tool'),
      },
      {
        id: 'runs',
        label: 'Runs',
        icon: FiActivity,
        enabled: true,
      },
    ],
    [
      analysisCapabilities.length,
      executable,
      flags,
      mediaCapabilities.length,
    ],
  );

  const enabledTabs = tabs.filter((tab) => tab.enabled);
  const [activeTab, setActiveTab] = useState<AiStudioTab>('chat');

  useEffect(() => {
    if (!enabledTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(enabledTabs[0]?.id ?? 'runs');
    }
  }, [activeTab, enabledTabs]);

  const modelSelectorEnabled =
    flags[FeatureFlag.AiModelSelector];
  const streamingEnabled = flags[FeatureFlag.AiStreaming];

  return (
    <section className="relative space-y-5">
      <header className="relative isolate overflow-hidden rounded-[28px] border border-[var(--ae-border)] bg-[var(--ae-glass-panel)] shadow-[var(--ae-shadow-lg)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[var(--ae-primary-subtle)] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-[var(--ae-accent-subtle)] blur-3xl"
        />
        <div className="relative grid gap-8 p-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ae-primary)]/40 bg-[var(--ae-primary-subtle)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ae-primary)]">
              <FiZap aria-hidden="true" />
              Aerealith intelligence workspace
            </div>

            <div className="mt-5 flex items-start gap-4">
              <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--ae-primary)]/50 bg-[var(--ae-background-elevated)] text-3xl text-[var(--ae-primary)] shadow-[var(--ae-shadow-sm)] sm:flex">
                <FiCpu aria-hidden="true" />
              </div>
              <div>
                <h1
                  className="text-4xl font-bold tracking-[-0.045em] sm:text-5xl"
                  style={{ fontFamily: 'var(--ae-font-heading)' }}
                >
                  AI Studio
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--ae-foreground-muted)] sm:text-base">
                  One place to think, build, generate, analyze, retrieve, and
                  execute. Aerealith routes each task to the best available
                  capability while keeping the underlying run visible.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ae-border)] bg-[var(--ae-background-elevated)]/80 px-3 py-2 text-xs font-semibold">
                <span
                  aria-hidden="true"
                  className={[
                    'h-2.5 w-2.5 rounded-full shadow-[0_0_14px_currentColor]',
                    capabilitiesQuery.isSuccess
                      ? 'bg-emerald-400 text-emerald-400'
                      : capabilitiesQuery.isError
                        ? 'bg-red-400 text-red-400'
                        : 'bg-amber-400 text-amber-400',
                  ].join(' ')}
                />
                <span className="text-[var(--ae-foreground-muted)]">
                  {capabilitiesQuery.isSuccess
                    ? 'AI runtime online'
                    : capabilitiesQuery.isError
                      ? 'AI runtime unavailable'
                      : 'Checking runtime'}
                </span>
              </div>
              <div className="rounded-full border border-[var(--ae-border)] bg-[var(--ae-background-elevated)]/80 px-3 py-2 text-xs font-semibold text-[var(--ae-foreground-muted)]">
                {enabledTabs.length} workspaces enabled
              </div>
              <div className="rounded-full border border-[var(--ae-border)] bg-[var(--ae-background-elevated)]/80 px-3 py-2 text-xs font-semibold text-[var(--ae-foreground-muted)]">
                {streamingEnabled ? 'Live streaming' : 'Durable runs'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Executable"
              value={
                capabilitiesQuery.data
                  ? String(capabilitiesQuery.data.executable.length)
                  : '—'
              }
              detail="capabilities"
              icon={FiZap}
            />
            <Metric
              label="Models"
              value={modelsQuery.data ? String(modelsQuery.data.length) : '—'}
              detail="available routes"
              icon={FiBox}
            />
            <Metric
              label="Runs today"
              value={usageQuery.data ? String(usageQuery.data.runs) : '—'}
              detail={
                usageQuery.data?.limits.dailyRuns
                  ? 'of ' + String(usageQuery.data.limits.dailyRuns)
                  : 'no daily cap'
              }
              icon={FiActivity}
            />
            <Metric
              label="Estimated cost"
              value={
                usageQuery.data
                  ? formatCost(usageQuery.data.estimatedCostUsd)
                  : '—'
              }
              detail="today"
              icon={FiBarChart2}
            />
          </div>
        </div>
      </header>

      {capabilitiesQuery.isError ? (
        <div
          role="alert"
          className="rounded-2xl border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] p-4 text-sm text-[var(--ae-danger-foreground)] shadow-[var(--ae-shadow-sm)]"
        >
          The AI service could not be reached. The UI stays fail-closed until
          the runtime and its Flagship rollout are both available.
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-glass-background-strong)] p-2 shadow-[var(--ae-shadow-sm)] backdrop-blur-xl">
        <nav
          className="flex gap-1.5 overflow-x-auto"
          aria-label="AI Studio"
        >
          {tabs
            .filter((tab) => tab.enabled)
            .map(({ id, label, icon: Icon }) => {
              const active = id === activeTab;
              return (
                <button
                  key={id}
                  type="button"
                  className={[
                    'group relative inline-flex min-h-12 shrink-0 items-center gap-2.5 overflow-hidden rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)]',
                    active
                      ? 'border-[var(--ae-primary)]/50 bg-[var(--ae-primary-subtle)] text-[var(--ae-foreground)] shadow-[var(--ae-shadow-sm)]'
                      : 'border-transparent text-[var(--ae-foreground-muted)] hover:border-[var(--ae-border)] hover:bg-[var(--ae-surface-muted)] hover:text-[var(--ae-foreground)]',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setActiveTab(id)}
                >
                  <span
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                      active
                        ? 'bg-[var(--ae-primary)] text-white'
                        : 'bg-[var(--ae-surface-muted)] text-[var(--ae-foreground-muted)] group-hover:text-[var(--ae-primary)]',
                    ].join(' ')}
                  >
                    <Icon aria-hidden="true" />
                  </span>
                  {label}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-5 bottom-0 h-px bg-[var(--ae-primary)]"
                    />
                  ) : null}
                </button>
              );
            })}
        </nav>
      </div>

      <div className="min-h-[38rem]">
        {activeTab === 'chat' ? (
          <AiChatPanel
            models={modelsQuery.data ?? []}
            modelSelectorEnabled={modelSelectorEnabled}
            streamingEnabled={streamingEnabled}
          />
        ) : null}

        {activeTab === 'code' ? (
          <AiCodePanel
            models={modelsQuery.data ?? []}
            modelSelectorEnabled={modelSelectorEnabled}
          />
        ) : null}

        {activeTab === 'media' ? (
          <AiMediaPanel
            capabilities={mediaCapabilities}
            models={modelsQuery.data ?? []}
            modelSelectorEnabled={modelSelectorEnabled}
          />
        ) : null}

        {activeTab === 'analyze' ? (
          <AiAnalyzePanel
            capabilities={analysisCapabilities}
            models={modelsQuery.data ?? []}
            modelSelectorEnabled={modelSelectorEnabled}
          />
        ) : null}

        {activeTab === 'knowledge' ? <AiKnowledgePanel /> : null}
        {activeTab === 'tools' ? <AiToolsPanel /> : null}
        {activeTab === 'runs' ? <AiRunsPanel /> : null}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof FiCpu;
}) {
  return (
    <div className="group rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-background-elevated)]/80 p-4 shadow-[var(--ae-shadow-sm)] transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface-muted)] text-[var(--ae-accent)] transition-colors group-hover:text-[var(--ae-primary)]">
          <Icon aria-hidden="true" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ae-foreground-muted)]">
          {label}
        </span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        <span className="pb-0.5 text-[11px] text-[var(--ae-foreground-muted)]">
          {detail}
        </span>
      </div>
    </div>
  );
}

function formatCost(value: number): string {
  if (value <= 0) return '$0.00';
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

export default AiStudio;
