import type {
  AiModelSummary,
  AiToolDefinition,
} from '@aerealith-ai/ai-client';
import type {
  CapabilityKind,
  OrchestrationRequest,
  RunRecord,
} from '@aerealith-ai/ai-orchestration';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import {
  FiBarChart2,
  FiCheckCircle,
  FiCode,
  FiDownload,
  FiImage,
  FiPlay,
  FiTool,
} from 'react-icons/fi';

import {
  aiApi,
  modelsForCapability,
  runArtifactIds,
  runOutputJson,
  runOutputText,
  waitForAiRun,
} from './ai-client';

type MediaCapability = Extract<
  CapabilityKind,
  'image' | 'audio' | 'video' | 'music'
>;

type AnalysisCapability = Extract<
  CapabilityKind,
  'analytics' | 'prediction'
>;

export function AiCodePanel({
  models,
  modelSelectorEnabled,
}: {
  models: readonly AiModelSummary[];
  modelSelectorEnabled: boolean;
}) {
  const codeModels = useMemo(
    () => modelsForCapability(models, 'code'),
    [models],
  );
  const [mode, setMode] = useState<
    'generate' | 'edit' | 'debug' | 'review' | 'test'
  >('generate');
  const [instruction, setInstruction] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [repositoryRef, setRepositoryRef] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const task = useAiTask();

  async function submit() {
    const trimmedInstruction = instruction.trim();
    if (!trimmedInstruction) return;

    await task.execute({
      capability: 'code',
      input: {
        mode,
        instruction: trimmedInstruction,
        ...(repositoryUrl.trim()
          ? {
              repository: {
                url: repositoryUrl.trim(),
                ...(repositoryRef.trim()
                  ? { ref: repositoryRef.trim() }
                  : {}),
              },
            }
          : {}),
      },
      ...(selectedModel
        ? { preferences: { model: selectedModel } }
        : {}),
    });
  }

  return (
    <Panel
      icon={FiCode}
      title="Coding agent"
      description="Generate code directly or give Aerealith a public GitHub repository to inspect, edit, test, and return as a patch artifact."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <label className="block">
            <Label>Mode</Label>
            <select
              value={mode}
              disabled={task.pending}
              className={inputClass}
              onChange={(event) =>
                setMode(event.target.value as typeof mode)
              }
            >
              <option value="generate">Generate</option>
              <option value="edit">Edit repository</option>
              <option value="debug">Debug</option>
              <option value="review">Review</option>
              <option value="test">Test</option>
            </select>
          </label>

          <label className="block">
            <Label>Instruction</Label>
            <textarea
              value={instruction}
              disabled={task.pending}
              rows={8}
              placeholder="Describe the code change or investigation you want Aerealith to perform…"
              className={textareaClass}
              onChange={(event) =>
                setInstruction(event.target.value)
              }
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <Label>Public GitHub repository</Label>
              <input
                value={repositoryUrl}
                disabled={task.pending}
                placeholder="https://github.com/org/repo.git"
                className={inputClass}
                onChange={(event) =>
                  setRepositoryUrl(event.target.value)
                }
              />
            </label>
            <label>
              <Label>Git ref</Label>
              <input
                value={repositoryRef}
                disabled={task.pending}
                placeholder="main"
                className={inputClass}
                onChange={(event) =>
                  setRepositoryRef(event.target.value)
                }
              />
            </label>
          </div>

          {modelSelectorEnabled ? (
            <ModelSelect
              models={codeModels}
              value={selectedModel}
              disabled={task.pending}
              onChange={setSelectedModel}
            />
          ) : null}

          <PrimaryAction
            label={task.pending ? 'Working…' : 'Run coding task'}
            disabled={task.pending || !instruction.trim()}
            onClick={() => void submit()}
          />
        </div>

        <TaskResult run={task.run} error={task.error} />
      </div>
    </Panel>
  );
}

export function AiMediaPanel({
  capabilities,
  models,
  modelSelectorEnabled,
}: {
  capabilities: readonly MediaCapability[];
  models: readonly AiModelSummary[];
  modelSelectorEnabled: boolean;
}) {
  const [capability, setCapability] = useState<MediaCapability>(
    capabilities[0] ?? 'image',
  );
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const task = useAiTask();

  const activeCapability = capabilities.includes(capability)
    ? capability
    : (capabilities[0] ?? 'image');
  const capabilityModels = useMemo(
    () => modelsForCapability(models, activeCapability),
    [activeCapability, models],
  );

  async function submit() {
    const value = prompt.trim();
    if (!value) return;

    await task.execute({
      capability: activeCapability,
      input:
        activeCapability === 'audio'
          ? { text: value }
          : { prompt: value },
      priority: 'background',
      ...(selectedModel
        ? { preferences: { model: selectedModel } }
        : {}),
    });
  }

  return (
    <Panel
      icon={FiImage}
      title="Media generation"
      description="Create images, speech, video, or music using the capabilities currently exposed by your Cloudflare AI runtime."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div>
            <Label>Capability</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {capabilities.map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={task.pending}
                  className={[
                    'min-h-11 rounded-xl border px-4 text-sm font-semibold capitalize transition-all duration-200',
                    value === activeCapability
                      ? 'border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] text-[var(--ae-foreground)] shadow-[var(--ae-shadow-sm)]'
                      : 'border-[var(--ae-border)] bg-[var(--ae-background-elevated)] text-[var(--ae-foreground-muted)] hover:-translate-y-0.5 hover:border-[var(--ae-primary)] hover:text-[var(--ae-foreground)]',
                  ].join(' ')}
                  onClick={() => {
                    setCapability(value);
                    setSelectedModel('');
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <Label>
              {activeCapability === 'audio'
                ? 'Text to speak'
                : 'Prompt'}
            </Label>
            <textarea
              value={prompt}
              disabled={task.pending}
              rows={7}
              placeholder={
                activeCapability === 'audio'
                  ? 'Enter the text Aerealith should speak…'
                  : 'Describe the ' + activeCapability + ' you want to generate…'
              }
              className={textareaClass}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </label>

          {modelSelectorEnabled ? (
            <ModelSelect
              models={capabilityModels}
              value={selectedModel}
              disabled={task.pending}
              onChange={setSelectedModel}
            />
          ) : null}

          <PrimaryAction
            label={
              task.pending
                ? 'Generating…'
                : 'Generate ' + activeCapability
            }
            disabled={task.pending || !prompt.trim()}
            onClick={() => void submit()}
          />
        </div>

        <TaskResult
          run={task.run}
          error={task.error}
          showArtifacts
        />
      </div>
    </Panel>
  );
}

export function AiAnalyzePanel({
  capabilities,
  models,
  modelSelectorEnabled,
}: {
  capabilities: readonly AnalysisCapability[];
  models: readonly AiModelSummary[];
  modelSelectorEnabled: boolean;
}) {
  const [capability, setCapability] = useState<AnalysisCapability>(
    capabilities[0] ?? 'analytics',
  );
  const [question, setQuestion] = useState('');
  const [data, setData] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [localError, setLocalError] = useState<string>();
  const task = useAiTask();

  const activeCapability = capabilities.includes(capability)
    ? capability
    : (capabilities[0] ?? 'analytics');
  const capabilityModels = useMemo(
    () => modelsForCapability(models, activeCapability),
    [activeCapability, models],
  );

  async function submit() {
    const objective = question.trim();
    if (!objective) return;

    setLocalError(undefined);
    let parsedData: unknown;

    if (data.trim()) {
      try {
        parsedData = JSON.parse(data);
      } catch {
        setLocalError('Data must be valid JSON.');
        return;
      }
    }

    await task.execute({
      capability: activeCapability,
      input:
        activeCapability === 'analytics'
          ? {
              question: objective,
              ...(parsedData === undefined
                ? {}
                : { data: parsedData }),
              requestedOutputs: [
                'summary',
                'statistics',
                'table',
              ],
            }
          : {
              objective,
              ...(parsedData === undefined
                ? {}
                : { data: parsedData }),
              confidenceIntervals: true,
            },
      ...(selectedModel
        ? { preferences: { model: selectedModel } }
        : {}),
    });
  }

  return (
    <Panel
      icon={FiBarChart2}
      title="Analytics & prediction"
      description="Ask analytical questions or run prediction tasks against structured JSON."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <label>
            <Label>Mode</Label>
            <select
              value={activeCapability}
              disabled={task.pending}
              className={inputClass}
              onChange={(event) => {
                setCapability(
                  event.target.value as AnalysisCapability,
                );
                setSelectedModel('');
              }}
            >
              {capabilities.map((value) => (
                <option key={value} value={value}>
                  {value === 'analytics'
                    ? 'Analytics'
                    : 'Prediction'}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <Label>
              {activeCapability === 'analytics'
                ? 'Question'
                : 'Prediction objective'}
            </Label>
            <textarea
              value={question}
              disabled={task.pending}
              rows={4}
              placeholder={
                activeCapability === 'analytics'
                  ? 'What should Aerealith analyze?'
                  : 'What should Aerealith predict?'
              }
              className={textareaClass}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </label>

          <label className="block">
            <Label>Data (optional JSON)</Label>
            <textarea
              value={data}
              disabled={task.pending}
              rows={8}
              spellCheck={false}
              placeholder='{"rows":[...]}'
              className={textareaClass + ' font-mono text-xs'}
              onChange={(event) => setData(event.target.value)}
            />
          </label>

          {localError ? (
            <ErrorNotice message={localError} />
          ) : null}

          {modelSelectorEnabled ? (
            <ModelSelect
              models={capabilityModels}
              value={selectedModel}
              disabled={task.pending}
              onChange={setSelectedModel}
            />
          ) : null}

          <PrimaryAction
            label={task.pending ? 'Analyzing…' : 'Run analysis'}
            disabled={task.pending || !question.trim()}
            onClick={() => void submit()}
          />
        </div>

        <TaskResult
          run={task.run}
          error={task.error}
          json
        />
      </div>
    </Panel>
  );
}

export function AiToolsPanel() {
  const toolsQuery = useQuery({
    queryKey: ['ai', 'tools'],
    queryFn: () => aiApi.tools(),
    staleTime: 60_000,
  });
  const [toolName, setToolName] = useState('');
  const [argumentsJson, setArgumentsJson] = useState(
    '{\n  "workspaceId": "default"\n}',
  );
  const [approved, setApproved] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const task = useAiTask();

  const selected = toolsQuery.data?.find(
    (tool) => tool.name === toolName,
  );

  async function submit() {
    if (!toolName) return;

    setLocalError(undefined);
    let args: unknown;

    try {
      args = JSON.parse(argumentsJson);
    } catch {
      setLocalError('Tool arguments must be valid JSON.');
      return;
    }

    await task.execute({
      capability: 'tool',
      input: {
        name: toolName,
        arguments: args,
      },
      metadata: {
        approved: approved ? 'true' : 'false',
      },
    });
  }

  return (
    <Panel
      icon={FiTool}
      title="Sandbox tools"
      description="Advanced workspace tools run through the isolated Cloudflare coding sandbox. Mutating tools require explicit approval."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <label>
            <Label>Tool</Label>
            <select
              value={toolName}
              className={inputClass}
              disabled={task.pending || toolsQuery.isPending}
              onChange={(event) => {
                setToolName(event.target.value);
                setApproved(false);
              }}
            >
              <option value="">Select a tool</option>
              {(toolsQuery.data ?? []).map((tool) => (
                <option key={tool.name} value={tool.name}>
                  {tool.name}
                </option>
              ))}
            </select>
          </label>

          {selected ? <ToolDescription tool={selected} /> : null}

          <label className="block">
            <Label>Arguments</Label>
            <textarea
              value={argumentsJson}
              rows={10}
              spellCheck={false}
              className={textareaClass + ' font-mono text-xs'}
              disabled={task.pending}
              onChange={(event) =>
                setArgumentsJson(event.target.value)
              }
            />
          </label>

          {selected?.requiresApproval ? (
            <label className="flex items-start gap-3 rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-surface-muted)] p-4 text-sm shadow-[var(--ae-shadow-sm)]">
              <input
                type="checkbox"
                checked={approved}
                className="mt-1"
                onChange={(event) =>
                  setApproved(event.target.checked)
                }
              />
              <span>
                I approve this mutating sandbox operation for the
                current request.
              </span>
            </label>
          ) : null}

          {localError ? (
            <ErrorNotice message={localError} />
          ) : null}

          <PrimaryAction
            label={task.pending ? 'Running…' : 'Run tool'}
            disabled={
              task.pending ||
              !toolName ||
              Boolean(selected?.requiresApproval && !approved)
            }
            onClick={() => void submit()}
          />
        </div>

        <TaskResult
          run={task.run}
          error={task.error}
          json
        />
      </div>
    </Panel>
  );
}

function ToolDescription({ tool }: { tool: AiToolDefinition }) {
  return (
    <div className="rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] p-4 shadow-[var(--ae-shadow-sm)]">
      <div className="flex items-center gap-2">
        <span className="font-semibold">{tool.name}</span>
        {tool.requiresApproval ? (
          <span className="rounded-full bg-[var(--ae-primary-subtle)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ae-primary)]">
            Approval required
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ae-foreground-muted)]">
        {tool.description}
      </p>
    </div>
  );
}

function useAiTask() {
  const queryClient = useQueryClient();
  const [run, setRun] = useState<RunRecord>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function execute(
    request: OrchestrationRequest,
  ): Promise<RunRecord | undefined> {
    if (pending) return undefined;

    setPending(true);
    setError(undefined);
    setRun(undefined);

    try {
      const accepted = await aiApi.createRun(request, {
        idempotencyKey: crypto.randomUUID(),
      });
      setRun(accepted);

      const completed = await waitForAiRun(accepted);
      setRun(completed);

      await queryClient.invalidateQueries({
        queryKey: ['ai'],
      });

      return completed;
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The AI task failed.',
      );
      return undefined;
    } finally {
      setPending(false);
    }
  }

  return {
    run,
    pending,
    error,
    execute,
  };
}

function TaskResult({
  run,
  error,
  showArtifacts = false,
  json = false,
}: {
  run?: RunRecord;
  error?: string;
  showArtifacts?: boolean;
  json?: boolean;
}) {
  if (error) return <ErrorNotice message={error} />;

  if (!run) {
    return (
      <aside className="relative flex min-h-72 overflow-hidden rounded-[24px] border border-dashed border-[var(--ae-border)] bg-[var(--ae-background-elevated)] p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--ae-primary-subtle),transparent_48%)] opacity-70" />
        <div className="relative m-auto max-w-xs text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-surface)] text-lg text-[var(--ae-primary)] shadow-[var(--ae-shadow-sm)]">
            <FiPlay aria-hidden="true" />
          </div>
          <p className="mt-4 font-semibold text-[var(--ae-foreground)]">Ready for a run</p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ae-foreground-muted)]">
            Configure the task on the left. Output, routing details, and downloadable artifacts will appear here.
          </p>
        </div>
      </aside>
    );
  }

  const artifacts = runArtifactIds(run);
  const text = runOutputText(run);

  return (
    <aside className="relative overflow-hidden rounded-[24px] border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] p-5 shadow-[var(--ae-shadow-sm)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_50%_0%,var(--ae-primary-subtle),transparent_70%)] opacity-70" />
      <div className="relative">
      <div className="flex items-center gap-2">
        <RunStatus status={run.status} />
        <span className="ml-auto font-mono text-[11px] text-[var(--ae-foreground-muted)]">
          {run.id.slice(0, 8)}
        </span>
      </div>

      {run.modelId ? (
        <p className="mt-3 break-all text-xs text-[var(--ae-foreground-muted)]">
          {run.providerId} · {run.modelId}
        </p>
      ) : null}

      {run.errorCode ? (
        <ErrorNotice message={run.errorCode} />
      ) : null}

      {json && run.output ? (
        <pre className="mt-4 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--ae-border)] bg-[var(--ae-surface)] p-4 text-xs leading-relaxed">
          {runOutputJson(run)}
        </pre>
      ) : text ? (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
          {text}
        </p>
      ) : null}

      {(showArtifacts || artifacts.length > 0) &&
      artifacts.length > 0 ? (
        <div className="mt-5 space-y-2">
          <Label>Artifacts</Label>
          {artifacts.map((artifactId, index) => (
            <a
              key={artifactId}
              href={aiApi.artifactUrl(artifactId)}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 items-center gap-3 rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface)] px-4 text-sm font-semibold no-underline transition-all hover:-translate-y-0.5 hover:border-[var(--ae-primary)] hover:shadow-[var(--ae-shadow-sm)]"
            >
              <FiDownload
                aria-hidden="true"
                className="text-[var(--ae-primary)]"
              />
              Open artifact {index + 1}
            </a>
          ))}
        </div>
      ) : null}
      </div>
    </aside>
  );
}

function RunStatus({ status }: { status: RunRecord['status'] }) {
  const finished = status === 'succeeded';
  const failed = status === 'failed' || status === 'cancelled';

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize',
        finished
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
          : failed
            ? 'border-red-500/40 bg-red-500/10 text-red-500'
            : 'border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] text-[var(--ae-primary)]',
      ].join(' ')}
    >
      {finished ? (
        <FiCheckCircle aria-hidden="true" />
      ) : (
        <span
          aria-hidden="true"
          className="h-2 w-2 rounded-full bg-current"
        />
      )}
      {status}
    </span>
  );
}

function Panel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof FiCode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[var(--ae-border)] bg-[var(--ae-surface)] p-5 shadow-[var(--ae-shadow-sm)] sm:p-6">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[var(--ae-primary-subtle)] blur-3xl opacity-70" />
      <div className="relative mb-7 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] text-xl text-[var(--ae-primary)] shadow-[var(--ae-shadow-sm)]">
          <Icon aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ae-primary)]">
            Aerealith workspace
          </p>
          <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--ae-foreground-muted)]">
            {description}
          </p>
        </div>
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

function ModelSelect({
  models,
  value,
  disabled,
  onChange,
}: {
  models: readonly AiModelSummary[];
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <Label>Model</Label>
      <select
        value={value}
        disabled={disabled}
        className={inputClass}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Automatic routing</option>
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {shortModelName(model.id)}
          </option>
        ))}
      </select>
    </label>
  );
}

function PrimaryAction({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--ae-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--ae-shadow-sm)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
      onClick={onClick}
    >
      <FiPlay aria-hidden="true" />
      {label}
    </button>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-3 rounded-lg border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] p-3 text-sm text-[var(--ae-danger-foreground)]"
    >
      {message}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ae-foreground-muted)]">
      {children}
    </span>
  );
}

function shortModelName(value: string): string {
  return value.split('/').at(-1) ?? value;
}

const inputClass =
  'mt-2 min-h-12 w-full rounded-xl border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] px-4 text-sm outline-none transition-all placeholder:text-[var(--ae-foreground-muted)] focus:border-[var(--ae-primary)] focus:ring-4 focus:ring-[var(--ae-primary-subtle)] disabled:opacity-60';

const textareaClass =
  'mt-2 w-full resize-y rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] px-4 py-3.5 text-sm leading-relaxed outline-none transition-all placeholder:text-[var(--ae-foreground-muted)] focus:border-[var(--ae-primary)] focus:ring-4 focus:ring-[var(--ae-primary-subtle)] disabled:opacity-60';
