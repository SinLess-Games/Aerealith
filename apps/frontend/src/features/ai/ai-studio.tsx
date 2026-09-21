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
    <section className="space-y-6">
      <header className="overflow-hidden rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-glass-panel)] shadow-[var(--ae-shadow-sm)]">
        <div className="relative p-6 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,var(--ae-primary-subtle),transparent_68%)]"
          />
          <div className="relative flex flex-wrap items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] text-2xl text-[var(--ae-primary)]">
              <FiCpu aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ae-primary)]">
                Aerealith AI
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                AI Studio
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--ae-foreground-muted)] sm:text-base">
                Chat, build, generate media, analyze data, search your
                knowledge bases, and run isolated coding tools from one
                workspace.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[var(--ae-border)] bg-[var(--ae-surface)] px-3 py-2 text-xs font-semibold text-[var(--ae-foreground-muted)]">
              <span
                className={[
                  'h-2 w-2 rounded-full',
                  capabilitiesQuery.isSuccess
                    ? 'bg-emerald-400'
                    : capabilitiesQuery.isError
                      ? 'bg-red-400'
                      : 'bg-amber-400',
                ].join(' ')}
              />
              {capabilitiesQuery.isSuccess
                ? 'AI runtime online'
                : capabilitiesQuery.isError
                  ? 'AI runtime unavailable'
                  : 'Checking runtime'}
            </div>
          </div>
        </div>

        <div className="grid border-t border-[var(--ae-border)] sm:grid-cols-2 xl:grid-cols-4">
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
            value={
              modelsQuery.data
                ? String(modelsQuery.data.length)
                : '—'
            }
            detail="available routes"
            icon={FiBox}
          />
          <Metric
            label="Runs today"
            value={
              usageQuery.data
                ? String(usageQuery.data.runs)
                : '—'
            }
            detail={
              usageQuery.data?.limits.dailyRuns
                ? `of ${usageQuery.data.limits.dailyRuns}`
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
      </header>

      {capabilitiesQuery.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] p-4 text-sm text-[var(--ae-danger-foreground)]"
        >
          The AI service could not be reached. The UI stays fail-closed until
          the runtime and its Flagship rollout are both available.
        </div>
      ) : null}

      <nav
        className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-2"
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
                  'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)]',
                  active
                    ? 'border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] text-[var(--ae-foreground)]'
                    : 'border-transparent text-[var(--ae-foreground-muted)] hover:border-[var(--ae-border)] hover:bg-[var(--ae-surface-muted)] hover:text-[var(--ae-foreground)]',
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
                onClick={() => setActiveTab(id)}
              >
                <Icon aria-hidden="true" />
                {label}
              </button>
            );
          })}
      </nav>

      <div className="min-h-[34rem]">
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

        {activeTab === 'knowledge' ? (
          <AiKnowledgePanel />
        ) : null}

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
    <div className="flex items-center gap-4 border-b border-[var(--ae-border)] p-5 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ae-surface-muted)] text-[var(--ae-accent)]">
        <Icon aria-hidden="true" />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ae-foreground-muted)]">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold">{value}</span>
          <span className="text-xs text-[var(--ae-foreground-muted)]">
            {detail}
          </span>
        </div>
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
