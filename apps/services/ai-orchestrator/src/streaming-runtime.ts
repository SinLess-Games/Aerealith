import {
  CapabilityRoutingPolicy,
  type ModelDescriptor,
  type OrchestrationOutput,
  type OrchestrationRequest,
  type RunRecord,
  type TextGenerationInput,
  type Usage,
} from '@aerealith-ai/ai-orchestration';

import {
  recordAiRunFailed,
  recordAiRunStarted,
  recordAiRunSucceeded,
} from './ai-telemetry';
import type { AiOrchestratorBindings } from './bindings';
import { createProviderRegistry } from './provider-runtime';
import type { DurableObjectRunStore } from './run-store';
import { AiUsageStore } from './usage-ledger';

const MAX_PERSISTED_STREAM_TEXT_BYTES = 480 * 1024;

export class StreamingUnavailableError extends Error {
  constructor(message = 'Streaming text generation is not configured.') {
    super(message);
    this.name = 'StreamingUnavailableError';
  }
}

export type StreamingRun = {
  run: RunRecord;
  stream: ReadableStream<Uint8Array>;
};

export async function startStreamingTextRun(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
  runs: DurableObjectRunStore,
): Promise<StreamingRun> {
  if (!bindings.AI) {
    throw new StreamingUnavailableError(
      'The Cloudflare AI binding is not configured.',
    );
  }

  const providers = createProviderRegistry(bindings);
  const policy = new CapabilityRoutingPolicy();
  const models = await providers.modelsFor('text');
  const route = policy.select(request, models);

  if (route.providerId !== 'cloudflare-workers-ai') {
    throw new StreamingUnavailableError(
      'Streaming currently requires a Cloudflare Workers AI text model.',
    );
  }

  const model = models.find(
    (candidate) =>
      candidate.providerId === route.providerId &&
      candidate.id === route.modelId,
  );

  if (!model) {
    throw new StreamingUnavailableError(
      'The selected streaming model is unavailable.',
    );
  }

  const input = request.input as TextGenerationInput;
  const raw = await bindings.AI.run(model.id, {
    messages: input.messages,
    stream: true,
    ...(input.maxOutputTokens === undefined
      ? {}
      : { max_completion_tokens: input.maxOutputTokens }),
    ...(input.temperature === undefined
      ? {}
      : { temperature: input.temperature }),
    ...(input.stop === undefined ? {} : { stop: input.stop }),
    ...(input.responseFormat === 'json'
      ? { response_format: { type: 'json_object' } }
      : {}),
  });

  if (!(raw instanceof ReadableStream)) {
    throw new StreamingUnavailableError(
      'Cloudflare Workers AI did not return a readable stream.',
    );
  }

  const timestamp = new Date().toISOString();
  const run: RunRecord = {
    id: crypto.randomUUID(),
    ...(request.tenantId ? { tenantId: request.tenantId } : {}),
    ...(request.actorId ? { actorId: request.actorId } : {}),
    status: 'running',
    capability: 'text',
    createdAt: timestamp,
    updatedAt: timestamp,
    startedAt: timestamp,
    providerId: route.providerId,
    modelId: route.modelId,
  };

  await runs.create(run);
  recordAiRunStarted({
    runId: run.id,
    capability: 'text',
  });

  return {
    run,
    stream: trackStreamingResponse(
      raw,
      bindings,
      request,
      runs,
      run,
      model,
    ),
  };
}

function trackStreamingResponse(
  source: ReadableStream<Uint8Array>,
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
  runs: DurableObjectRunStore,
  run: RunRecord,
  model: ModelDescriptor,
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const startedAtMs = Date.now();
  let buffer = '';
  let text = '';
  let persistedBytes = 0;
  let usage: Usage | undefined;
  let finalized = false;

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(chunk);

      const decoded = decoder.decode(chunk, { stream: true });
      buffer += decoded;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const parsed = parseSseData(line);
        if (!parsed) continue;

        const delta = streamDelta(parsed);
        if (delta) {
          const bytes = new TextEncoder().encode(delta).byteLength;
          if (
            persistedBytes + bytes <=
            MAX_PERSISTED_STREAM_TEXT_BYTES
          ) {
            text += delta;
            persistedBytes += bytes;
          }
        }

        const parsedUsage = streamUsage(parsed, model);
        if (parsedUsage) usage = parsedUsage;
      }
    },
    async flush() {
      if (buffer) {
        const parsed = parseSseData(buffer);
        if (parsed) {
          const delta = streamDelta(parsed);
          if (delta) text += delta;
          usage = streamUsage(parsed, model) ?? usage;
        }
      }

      await finalizeSuccess();
    },
  });

  async function finalizeSuccess(): Promise<void> {
    if (finalized) return;
    finalized = true;

    const completedAt = new Date().toISOString();
    const output: OrchestrationOutput = {
      providerId: model.providerId,
      modelId: model.id,
      content: {
        text,
        streamed: true,
        truncatedInRunState:
          persistedBytes >= MAX_PERSISTED_STREAM_TEXT_BYTES,
      },
      ...(usage ? { usage } : {}),
    };

    await runs.updateStatus(run.id, 'succeeded', {
      providerId: model.providerId,
      modelId: model.id,
      output,
      completedAt,
    });

    if (bindings.AI_USAGE && request.tenantId) {
      await new AiUsageStore(bindings.AI_USAGE).recordUsage(
        request.tenantId,
        usage,
      );
    }

    recordAiRunSucceeded({
      runId: run.id,
      capability: 'text',
      durationMs: Date.now() - startedAtMs,
      output,
    });
  }

  source.closed?.catch?.(() => undefined);

  return source
    .pipeThrough(transform)
    .pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          controller.enqueue(chunk);
        },
        async flush() {
          await finalizeSuccess();
        },
      }),
    );
}

function parseSseData(line: string): Record<string, unknown> | undefined {
  const trimmed = line.trim();

  if (!trimmed.startsWith('data:')) return undefined;

  const value = trimmed.slice(5).trim();
  if (!value || value === '[DONE]') return undefined;

  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function streamDelta(
  value: Record<string, unknown>,
): string | undefined {
  const choices = value['choices'];
  if (!Array.isArray(choices)) return undefined;

  const first = choices[0];
  if (!isRecord(first)) return undefined;

  const delta = first['delta'];
  if (!isRecord(delta)) return undefined;

  return typeof delta['content'] === 'string'
    ? delta['content']
    : undefined;
}

function streamUsage(
  value: Record<string, unknown>,
  model: ModelDescriptor,
): Usage | undefined {
  const raw = value['usage'];
  if (!isRecord(raw)) return undefined;

  const inputUnits = numeric(
    raw['prompt_tokens'] ?? raw['input_tokens'],
  );
  const outputUnits = numeric(
    raw['completion_tokens'] ?? raw['output_tokens'],
  );
  const totalUnits =
    numeric(raw['total_tokens']) ??
    (inputUnits === undefined && outputUnits === undefined
      ? undefined
      : (inputUnits ?? 0) + (outputUnits ?? 0));

  const estimatedCostUsd =
    (inputUnits !== undefined ||
      outputUnits !== undefined) &&
    (inputUnits === undefined ||
      model.inputCostPerMillionUnitsUsd !== undefined) &&
    (outputUnits === undefined ||
      model.outputCostPerMillionUnitsUsd !== undefined)
      ? ((inputUnits ?? 0) / 1_000_000) *
          (model.inputCostPerMillionUnitsUsd ?? 0) +
        ((outputUnits ?? 0) / 1_000_000) *
          (model.outputCostPerMillionUnitsUsd ?? 0)
      : undefined;

  return {
    ...(inputUnits === undefined ? {} : { inputUnits }),
    ...(outputUnits === undefined ? {} : { outputUnits }),
    ...(totalUnits === undefined ? {} : { totalUnits }),
    ...(estimatedCostUsd === undefined ? {} : { estimatedCostUsd }),
  };
}

function numeric(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
