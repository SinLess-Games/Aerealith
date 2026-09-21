import {
  AiApiClient,
  type AiModelSummary,
} from '@aerealith-ai/ai-client';
import type {
  CapabilityKind,
  RunRecord,
} from '@aerealith-ai/ai-orchestration';

export const aiApi = new AiApiClient();

const TERMINAL_STATUSES = new Set([
  'succeeded',
  'failed',
  'cancelled',
]);

export function isTerminalRun(run: RunRecord): boolean {
  return TERMINAL_STATUSES.has(run.status);
}

export async function waitForAiRun(
  run: RunRecord,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
  } = {},
): Promise<RunRecord> {
  if (isTerminalRun(run)) return run;

  const intervalMs = options.intervalMs ?? 1_250;
  const timeoutMs = options.timeoutMs ?? 5 * 60_000;
  const deadline = Date.now() + timeoutMs;
  let current = run;

  while (!isTerminalRun(current)) {
    if (options.signal?.aborted) {
      throw new DOMException('AI run polling was aborted.', 'AbortError');
    }

    if (Date.now() >= deadline) {
      throw new Error('The AI run did not finish before the UI timeout.');
    }

    await delay(intervalMs, options.signal);
    current = await aiApi.getRun(current.id);
  }

  return current;
}

export function modelsForCapability(
  models: readonly AiModelSummary[],
  capability: CapabilityKind,
): readonly AiModelSummary[] {
  return models.filter((model) =>
    model.capabilities.includes(capability),
  );
}

export async function consumeAiTextStream(
  stream: ReadableStream<Uint8Array>,
  onDelta: (delta: string) => void,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let complete = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const delta = textDeltaFromSseLine(line);
        if (!delta) continue;
        complete += delta;
        onDelta(delta);
      }
    }

    buffer += decoder.decode();
    if (buffer) {
      const delta = textDeltaFromSseLine(buffer);
      if (delta) {
        complete += delta;
        onDelta(delta);
      }
    }
  } finally {
    reader.releaseLock();
  }

  return complete;
}

export function runOutputText(run: RunRecord): string | undefined {
  const output = run.output;
  if (!output || typeof output !== 'object') return undefined;

  const content = (output as { content?: unknown }).content;
  if (!content || typeof content !== 'object') return undefined;

  const text = (content as { text?: unknown }).text;
  if (typeof text === 'string') return text;

  const summary = (content as { summary?: unknown }).summary;
  return typeof summary === 'string' ? summary : undefined;
}

export function runArtifactIds(run: RunRecord): readonly string[] {
  const output = run.output;
  if (!output || typeof output !== 'object') return [];

  const artifacts = (output as { artifacts?: unknown }).artifacts;
  return Array.isArray(artifacts)
    ? artifacts.filter(
        (value): value is string => typeof value === 'string',
      )
    : [];
}

export function runOutputJson(run: RunRecord): string {
  return JSON.stringify(run.output?.content ?? run.output ?? {}, null, 2);
}

function textDeltaFromSseLine(line: string): string | undefined {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return undefined;

  const data = trimmed.slice(5).trim();
  if (!data || data === '[DONE]') return undefined;

  try {
    const parsed = JSON.parse(data) as {
      choices?: Array<{
        delta?: {
          content?: unknown;
        };
      }>;
    };

    const value = parsed.choices?.[0]?.delta?.content;
    return typeof value === 'string' ? value : undefined;
  } catch {
    return undefined;
  }
}

function delay(
  milliseconds: number,
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(
      new DOMException('AI run polling was aborted.', 'AbortError'),
    );
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(
          new DOMException('AI run polling was aborted.', 'AbortError'),
        );
      },
      { once: true },
    );
  });
}
