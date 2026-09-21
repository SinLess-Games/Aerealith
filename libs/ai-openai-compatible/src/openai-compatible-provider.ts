import type {
  CodeGenerationInput,
  EmbeddingInput,
  EmbeddingOutput,
  ModelDescriptor,
  ModelProvider,
  OrchestrationOutput,
  OrchestrationRequest,
  TextGenerationInput,
  TextGenerationOutput,
} from '@aerealith-ai/ai-orchestration';

export type OpenAiCompatibleProviderOptions = {
  id: string;
  baseUrl: string;
  apiKey?: string;
  models: readonly ModelDescriptor[];
  headers?: Readonly<Record<string, string>>;
  fetchImplementation?: typeof globalThis.fetch;
};

type ChatCompletionResponse = {
  choices?: Array<{
    finish_reason?: string | null;
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

type EmbeddingResponse = {
  data?: Array<{
    index?: number;
    embedding?: number[];
  }>;
  usage?: {
    prompt_tokens?: number;
    total_tokens?: number;
  };
};

export class OpenAiCompatibleProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAiCompatibleProviderError';
  }
}

export class OpenAiCompatibleProvider implements ModelProvider {
  readonly id: string;

  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly models: readonly ModelDescriptor[];
  private readonly headers: Readonly<Record<string, string>>;
  private readonly fetchImplementation: typeof globalThis.fetch;

  constructor(options: OpenAiCompatibleProviderOptions) {
    this.id = options.id.trim();
    this.baseUrl = trimTrailingSlashes(options.baseUrl.trim());
    this.apiKey = options.apiKey?.trim() || undefined;
    this.models = options.models;
    this.headers = options.headers ?? {};
    this.fetchImplementation =
      options.fetchImplementation ?? globalThis.fetch.bind(globalThis);

    if (!this.id) {
      throw new OpenAiCompatibleProviderError('A provider id is required.');
    }

    if (!this.baseUrl) {
      throw new OpenAiCompatibleProviderError(
        'An OpenAI-compatible base URL is required.',
      );
    }

    for (const model of this.models) {
      if (model.providerId !== this.id) {
        throw new OpenAiCompatibleProviderError(
          `Model "${model.id}" belongs to provider "${model.providerId}" instead of "${this.id}".`,
        );
      }
    }
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
      default:
        throw new OpenAiCompatibleProviderError(
          `Capability "${request.capability}" is not implemented by the OpenAI-compatible provider.`,
        );
    }
  }

  private async executeText(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    const input = parseTextInput(request.input);
    const response = await this.request<ChatCompletionResponse>(
      '/chat/completions',
      {
        model: model.id,
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
      },
    );

    const choice = response.choices?.[0];
    const text = choice?.message?.content;

    if (typeof text !== 'string') {
      throw new OpenAiCompatibleProviderError(
        'The chat completion response did not contain text output.',
      );
    }

    const content: TextGenerationOutput = {
      text,
      ...(choice?.finish_reason
        ? { finishReason: choice.finish_reason }
        : {}),
    };

    return {
      content,
      providerId: this.id,
      modelId: model.id,
      usage: usageFromTokens(model, response.usage),
    };
  }

  private executeCode(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    const input = parseCodeInput(request.input);
    const constraints =
      input.constraints && input.constraints.length > 0
        ? `\n\nConstraints:\n${input.constraints
            .map((constraint) => `- ${constraint}`)
            .join('\n')}`
        : '';

    const paths =
      input.paths && input.paths.length > 0
        ? `\n\nRelevant paths:\n${input.paths
            .map((path) => `- ${path}`)
            .join('\n')}`
        : '';

    return this.executeText(
      {
        ...request,
        capability: 'text',
        input: {
          messages: [
            {
              role: 'system',
              content:
                'You are a software engineering model. Return precise implementation output and do not claim to have executed tools unless tool results were provided.',
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
  }

  private async executeEmbedding(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    const input = parseEmbeddingInput(request.input);
    const response = await this.request<EmbeddingResponse>('/embeddings', {
      model: model.id,
      input: input.texts,
    });

    const data = [...(response.data ?? [])].sort(
      (left, right) => (left.index ?? 0) - (right.index ?? 0),
    );
    const vectors = data.map((item) => item.embedding ?? []);

    if (
      vectors.length !== input.texts.length ||
      vectors.some((vector) => vector.length === 0)
    ) {
      throw new OpenAiCompatibleProviderError(
        'The embedding response did not contain one non-empty vector per input.',
      );
    }

    const dimensions = vectors[0]?.length ?? 0;
    if (vectors.some((vector) => vector.length !== dimensions)) {
      throw new OpenAiCompatibleProviderError(
        'The embedding response returned inconsistent vector dimensions.',
      );
    }

    const content: EmbeddingOutput = {
      vectors,
      dimensions,
    };

    return {
      content,
      providerId: this.id,
      modelId: model.id,
      usage: usageFromTokens(model, response.usage),
    };
  }

  private assertModel(model: ModelDescriptor): void {
    if (
      model.providerId !== this.id ||
      !this.models.some((candidate) => candidate.id === model.id)
    ) {
      throw new OpenAiCompatibleProviderError(
        `Model "${model.id}" is not registered with provider "${this.id}".`,
      );
    }
  }

  private async request<T>(
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const headers = new Headers(this.headers);
    headers.set('content-type', 'application/json');

    if (this.apiKey) {
      headers.set('authorization', `Bearer ${this.apiKey}`);
    }

    const response = await this.fetchImplementation(
      `${this.baseUrl}${path}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      throw new OpenAiCompatibleProviderError(
        `OpenAI-compatible provider request failed with HTTP ${response.status}.`,
      );
    }

    return (await response.json()) as T;
  }
}

function parseTextInput(input: unknown): TextGenerationInput {
  if (!isRecord(input) || !Array.isArray(input['messages'])) {
    throw new OpenAiCompatibleProviderError(
      'Text generation requires a messages array.',
    );
  }

  const messages = input['messages'];
  for (const message of messages) {
    if (
      !isRecord(message) ||
      typeof message['role'] !== 'string' ||
      typeof message['content'] !== 'string'
    ) {
      throw new OpenAiCompatibleProviderError(
        'Every text-generation message requires string role and content fields.',
      );
    }
  }

  return input as unknown as TextGenerationInput;
}

function parseCodeInput(input: unknown): CodeGenerationInput {
  if (
    !isRecord(input) ||
    typeof input['mode'] !== 'string' ||
    typeof input['instruction'] !== 'string'
  ) {
    throw new OpenAiCompatibleProviderError(
      'Code generation requires mode and instruction fields.',
    );
  }

  return input as unknown as CodeGenerationInput;
}

function parseEmbeddingInput(input: unknown): EmbeddingInput {
  if (
    !isRecord(input) ||
    !Array.isArray(input['texts']) ||
    input['texts'].length === 0 ||
    input['texts'].some((text) => typeof text !== 'string')
  ) {
    throw new OpenAiCompatibleProviderError(
      'Embedding generation requires a non-empty texts array.',
    );
  }

  return input as unknown as EmbeddingInput;
}

function usageFromTokens(
  model: ModelDescriptor,
  usage:
    | {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      }
    | undefined,
) {
  if (!usage) return undefined;

  const inputUnits = usage.prompt_tokens;
  const outputUnits = usage.completion_tokens;
  const totalUnits =
    usage.total_tokens ??
    (inputUnits === undefined && outputUnits === undefined
      ? undefined
      : (inputUnits ?? 0) + (outputUnits ?? 0));

  const estimatedCostUsd =
    inputUnits === undefined && outputUnits === undefined
      ? undefined
      : ((inputUnits ?? 0) / 1_000_000) *
          (model.inputCostPerMillionUnitsUsd ?? 0) +
        ((outputUnits ?? 0) / 1_000_000) *
          (model.outputCostPerMillionUnitsUsd ?? 0);

  return {
    ...(inputUnits === undefined ? {} : { inputUnits }),
    ...(outputUnits === undefined ? {} : { outputUnits }),
    ...(totalUnits === undefined ? {} : { totalUnits }),
    ...(estimatedCostUsd === undefined ? {} : { estimatedCostUsd }),
  };
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
