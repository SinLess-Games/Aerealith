import type {
  AnalyticsInput,
  AnalyticsOutput,
  AudioGenerationInput,
  CodeGenerationInput,
  EmbeddingInput,
  EmbeddingOutput,
  ImageGenerationInput,
  ModelDescriptor,
  ModelProvider,
  OrchestrationOutput,
  OrchestrationRequest,
  PredictionInput,
  PredictionOutput,
  RerankInput,
  RerankOutput,
  TextGenerationInput,
  TextGenerationOutput,
} from '@aerealith-ai/ai-orchestration';

import {
  CLOUDFLARE_WORKERS_AI_PROVIDER_ID,
  cloudflareWorkersAiModelCatalog,
} from './models';

export interface WorkersAiBinding {
  run(
    model: string,
    input: Record<string, unknown>,
  ): Promise<unknown>;
}

export type CloudflareWorkersAiProviderOptions = {
  binding: WorkersAiBinding;
  models?: readonly ModelDescriptor[];
};

export type GeneratedBinary = {
  kind: 'image' | 'audio';
  contentType: string;
  data: ArrayBuffer | ReadableStream<Uint8Array>;
};

export class CloudflareWorkersAiProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CloudflareWorkersAiProviderError';
  }
}

export class CloudflareWorkersAiProvider implements ModelProvider {
  readonly id = CLOUDFLARE_WORKERS_AI_PROVIDER_ID;

  private readonly models: readonly ModelDescriptor[];

  constructor(
    private readonly binding: WorkersAiBinding,
    options: Omit<CloudflareWorkersAiProviderOptions, 'binding'> = {},
  ) {
    this.models = options.models ?? cloudflareWorkersAiModelCatalog;
  }

  listModels(): readonly ModelDescriptor[] {
    return this.models;
  }

  async execute(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    this.assertModel(model);

    switch (request.capability) {
      case 'text':
        return this.executeText(request, model);
      case 'code':
        return this.executeCode(request, model);
      case 'embedding':
        return this.executeEmbedding(request, model);
      case 'rerank':
        return this.executeRerank(request, model);
      case 'image':
        return this.executeImage(request, model);
      case 'audio':
        return this.executeAudio(request, model);
      case 'analytics':
        return this.executeAnalytics(request, model);
      case 'prediction':
        return this.executePrediction(request, model);
      default:
        throw new CloudflareWorkersAiProviderError(
          `Capability "${request.capability}" is not implemented by the Cloudflare Workers AI adapter.`,
        );
    }
  }

  private async executeText(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    const input = request.input as TextGenerationInput;
    const response = await this.binding.run(model.id, {
      messages: input.messages,
      ...(input.maxOutputTokens === undefined
        ? {}
        : { max_tokens: input.maxOutputTokens }),
      ...(input.temperature === undefined
        ? {}
        : { temperature: input.temperature }),
      ...(input.stop === undefined ? {} : { stop: input.stop }),
      ...(input.responseFormat === 'json'
        ? { response_format: { type: 'json_object' } }
        : {}),
    });

    const normalized = normalizeTextResponse(response);
    const content: TextGenerationOutput = {
      text: normalized.text,
      ...(normalized.finishReason
        ? { finishReason: normalized.finishReason }
        : {}),
    };

    return {
      content,
      providerId: this.id,
      modelId: model.id,
      ...(normalized.usage
        ? { usage: normalizeUsage(model, normalized.usage) }
        : {}),
    };
  }

  private async executeCode(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    const input = request.input as CodeGenerationInput;
    const constraints =
      input.constraints?.length
        ? `\n\nConstraints:\n${input.constraints
            .map((constraint) => `- ${constraint}`)
            .join('\n')}`
        : '';
    const paths =
      input.paths?.length
        ? `\n\nRelevant paths:\n${input.paths
            .map((path) => `- ${path}`)
            .join('\n')}`
        : '';

    const response = await this.executeText(
      {
        ...request,
        capability: 'text',
        input: {
          messages: [
            {
              role: 'system',
              content:
                'You are a software engineering model. Return precise implementation output. Do not claim to have run tools or changed files unless tool results were provided.',
            },
            {
              role: 'user',
              content: `Task mode: ${input.mode}\n\n${input.instruction}${paths}${constraints}`,
            },
          ],
        } satisfies TextGenerationInput,
      },
      model,
    );

    const text = (response.content as TextGenerationOutput).text;

    return {
      ...response,
      content: {
        summary: text,
      },
    };
  }

  private async executeEmbedding(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    const input = request.input as EmbeddingInput;
    const response = await this.binding.run(model.id, {
      text: input.texts,
    });

    const vectors = normalizeEmbeddingResponse(response, input.texts.length);
    const dimensions = vectors[0]?.length ?? 0;

    const content: EmbeddingOutput = {
      vectors,
      dimensions,
    };

    return {
      content,
      providerId: this.id,
      modelId: model.id,
    };
  }

  private async executeRerank(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    const input = request.input as RerankInput;
    const response = await this.binding.run(model.id, {
      query: input.query,
      contexts: input.documents.map((document) => ({ text: document.text })),
      ...(input.limit === undefined ? {} : { top_k: input.limit }),
    });

    const content: RerankOutput = {
      results: normalizeRerankResponse(response, input.documents),
    };

    return {
      content,
      providerId: this.id,
      modelId: model.id,
    };
  }

  private async executeImage(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    const input = request.input as ImageGenerationInput;
    if (
      input.count !== undefined && input.count !== 1 ||
      input.negativePrompt !== undefined ||
      input.width !== undefined ||
      input.height !== undefined ||
      (input.referenceArtifactIds?.length ?? 0) > 0
    ) {
      throw new CloudflareWorkersAiProviderError(
        'The selected Cloudflare FLUX model currently supports prompt, seed, and a single generated image only.',
      );
    }

    const response = await this.binding.run(model.id, {
      prompt: input.prompt,
      ...(input.seed === undefined ? {} : { seed: input.seed }),
    });

    if (!isRecord(response) || typeof response['image'] !== 'string') {
      throw new CloudflareWorkersAiProviderError(
        'Workers AI image generation returned an invalid response.',
      );
    }

    const bytes = base64ToArrayBuffer(response['image']);

    return {
      content: {
        kind: 'image',
        contentType: 'image/jpeg',
        data: bytes,
      } satisfies GeneratedBinary,
      providerId: this.id,
      modelId: model.id,
    };
  }

  private async executeAudio(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    const input = request.input as AudioGenerationInput;

    if (
      !input.text ||
      input.prompt !== undefined ||
      input.language !== undefined ||
      input.durationSeconds !== undefined
    ) {
      throw new CloudflareWorkersAiProviderError(
        'Cloudflare Aura audio generation requires text input and currently supports voice plus output-format controls only.',
      );
    }

    const response = await this.binding.run(model.id, {
      text: input.text,
      ...(input.voice ? { speaker: input.voice } : {}),
      encoding: audioEncoding(input.format),
      ...(input.format === 'wav' ? { container: 'wav' } : {}),
      ...(input.format === 'ogg' ? { container: 'ogg' } : {}),
    });

    if (!(response instanceof ReadableStream)) {
      throw new CloudflareWorkersAiProviderError(
        'Workers AI audio generation did not return a readable stream.',
      );
    }

    return {
      content: {
        kind: 'audio',
        contentType: audioContentType(input.format),
        data: response,
      } satisfies GeneratedBinary,
      providerId: this.id,
      modelId: model.id,
    };
  }

  private async executeAnalytics(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    const input = request.input as AnalyticsInput;
    const response = await this.executeText(
      {
        ...request,
        capability: 'text',
        input: {
          messages: [
            {
              role: 'system',
              content:
                'You are a rigorous data analyst. State assumptions, separate evidence from inference, and do not invent measurements.',
            },
            {
              role: 'user',
              content: JSON.stringify(input),
            },
          ],
          responseFormat: 'text',
        } satisfies TextGenerationInput,
      },
      model,
    );

    const content: AnalyticsOutput = {
      summary: (response.content as TextGenerationOutput).text,
    };

    return { ...response, content };
  }

  private async executePrediction(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    const input = request.input as PredictionInput;
    const response = await this.executeText(
      {
        ...request,
        capability: 'text',
        input: {
          messages: [
            {
              role: 'system',
              content:
                'You are a forecasting assistant. Use only supplied data, make uncertainty explicit, and never present unsupported forecasts as certain.',
            },
            {
              role: 'user',
              content: JSON.stringify(input),
            },
          ],
          responseFormat: 'text',
        } satisfies TextGenerationInput,
      },
      model,
    );

    const text = (response.content as TextGenerationOutput).text;
    const content: PredictionOutput = {
      summary: text,
      predictions: text,
    };

    return { ...response, content };
  }

  private assertModel(model: ModelDescriptor): void {
    if (
      model.providerId !== this.id ||
      !this.models.some((candidate) => candidate.id === model.id)
    ) {
      throw new CloudflareWorkersAiProviderError(
        `Model "${model.id}" is not registered with Cloudflare Workers AI.`,
      );
    }
  }
}

function normalizeTextResponse(response: unknown): {
  text: string;
  finishReason?: string;
  usage?: Record<string, unknown>;
} {
  if (!isRecord(response)) {
    throw new CloudflareWorkersAiProviderError(
      'Workers AI text generation returned an invalid response.',
    );
  }

  if (typeof response['response'] === 'string') {
    return {
      text: response['response'],
      ...(isRecord(response['usage'])
        ? { usage: response['usage'] }
        : {}),
    };
  }

  const choices = response['choices'];
  if (Array.isArray(choices)) {
    const choice = choices[0];
    if (isRecord(choice)) {
      const message = choice['message'];
      const content =
        isRecord(message) && typeof message['content'] === 'string'
          ? message['content']
          : undefined;

      if (content) {
        return {
          text: content,
          ...(typeof choice['finish_reason'] === 'string'
            ? { finishReason: choice['finish_reason'] }
            : {}),
          ...(isRecord(response['usage'])
            ? { usage: response['usage'] }
            : {}),
        };
      }
    }
  }

  throw new CloudflareWorkersAiProviderError(
    'Workers AI text generation returned no text.',
  );
}

function normalizeEmbeddingResponse(
  response: unknown,
  expected: number,
): readonly (readonly number[])[] {
  if (!isRecord(response) || !Array.isArray(response['data'])) {
    throw new CloudflareWorkersAiProviderError(
      'Workers AI embeddings returned an invalid response.',
    );
  }

  const data = response['data'];
  const vectors = data.map((entry) => {
    if (
      Array.isArray(entry) &&
      entry.every((value) => typeof value === 'number')
    ) {
      return entry as number[];
    }

    if (
      isRecord(entry) &&
      Array.isArray(entry['embedding']) &&
      entry['embedding'].every((value) => typeof value === 'number')
    ) {
      return entry['embedding'] as number[];
    }

    throw new CloudflareWorkersAiProviderError(
      'Workers AI embeddings contained an invalid vector.',
    );
  });

  if (
    vectors.length !== expected ||
    vectors.some((vector) => vector.length === 0)
  ) {
    throw new CloudflareWorkersAiProviderError(
      'Workers AI embeddings did not return one non-empty vector per input.',
    );
  }

  return vectors;
}

function normalizeRerankResponse(
  response: unknown,
  documents: readonly { id: string; text: string }[],
): RerankOutput['results'] {
  if (!isRecord(response) || !Array.isArray(response['response'])) {
    throw new CloudflareWorkersAiProviderError(
      'Workers AI reranking returned an invalid response.',
    );
  }

  return response['response'].map((entry, order) => {
    if (!isRecord(entry)) {
      throw new CloudflareWorkersAiProviderError(
        'Workers AI reranking contained an invalid result.',
      );
    }

    const index =
      typeof entry['id'] === 'number'
        ? entry['id']
        : typeof entry['index'] === 'number'
          ? entry['index']
          : order;
    const score =
      typeof entry['score'] === 'number'
        ? entry['score']
        : typeof entry['relevance_score'] === 'number'
          ? entry['relevance_score']
          : undefined;
    const document = documents[index];

    if (!document || score === undefined) {
      throw new CloudflareWorkersAiProviderError(
        'Workers AI reranking returned an unmappable result.',
      );
    }

    return {
      id: document.id,
      score,
    };
  });
}

function normalizeUsage(
  model: ModelDescriptor,
  usage: Record<string, unknown>,
) {
  const inputUnits = numericUsage(
    usage['prompt_tokens'] ?? usage['input_tokens'],
  );
  const outputUnits = numericUsage(
    usage['completion_tokens'] ?? usage['output_tokens'],
  );
  const totalUnits =
    numericUsage(usage['total_tokens']) ??
    (inputUnits === undefined && outputUnits === undefined
      ? undefined
      : (inputUnits ?? 0) + (outputUnits ?? 0));

  const canEstimate =
    (inputUnits === undefined ||
      model.inputCostPerMillionUnitsUsd !== undefined) &&
    (outputUnits === undefined ||
      model.outputCostPerMillionUnitsUsd !== undefined);

  const estimatedCostUsd =
    canEstimate &&
    (inputUnits !== undefined || outputUnits !== undefined)
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

function numericUsage(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function audioEncoding(
  format: AudioGenerationInput['format'],
): string {
  switch (format) {
    case 'wav':
      return 'linear16';
    case 'flac':
      return 'flac';
    case 'ogg':
      return 'opus';
    case 'mp3':
    case undefined:
      return 'mp3';
  }
}

function audioContentType(
  format: AudioGenerationInput['format'],
): string {
  switch (format) {
    case 'wav':
      return 'audio/wav';
    case 'flac':
      return 'audio/flac';
    case 'ogg':
      return 'audio/ogg';
    case 'mp3':
    case undefined:
      return 'audio/mpeg';
  }
}

function base64ToArrayBuffer(value: string): ArrayBuffer {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) =>
    character.codePointAt(0) ?? 0,
  );

  return bytes.buffer;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
