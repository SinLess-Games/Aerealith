import type { GeneratedBinary } from '@aerealith-ai/ai-cloudflare-workers';
import {
  capabilityKinds,
  CapabilityRoutingPolicy,
  FixedWindowTextChunker,
  KnowledgeIngestionService,
  OrchestrationExecutor,
  ProviderExecutionError,
  type CapabilityKind,
  type CodeGenerationInput,
  type EmbeddingGenerator,
  type EmbeddingOutput,
  type KnowledgeIngestionInput,
  type KnowledgeIngestionOutput,
  type MediaGenerationOutput,
  type ModelDescriptor,
  type ModelProvider,
  type OrchestrationOutput,
  type OrchestrationRequest,
  type RetrievalInput,
  type RetrievalMatch,
  type RetrievalOutput,
  type RerankOutput,
  type Usage,
} from '@aerealith-ai/ai-orchestration';

import { createArtifactStore } from './artifact-runtime';
import {
  codeRequestNeedsSandbox,
  executeCodeAgent,
} from './code-agent-runtime';
import type { AiOrchestratorBindings } from './bindings';
import { createProviderRegistry } from './provider-runtime';
import { executeToolRequest } from './tool-runtime';
import {
  createVectorStore,
  vectorStoreStatus,
} from './vector-store';

const MAX_GENERATED_MEDIA_BYTES = 512 * 1024 * 1024;
const MAX_GENERATED_MEDIA_REDIRECTS = 5;

export class VectorStoreUnavailableError extends Error {
  constructor() {
    super('The vector store is not configured.');
    this.name = 'VectorStoreUnavailableError';
  }
}

export class ArtifactStoreUnavailableError extends Error {
  constructor() {
    super('The artifact store is not configured.');
    this.name = 'ArtifactStoreUnavailableError';
  }
}

export class TenantContextRequiredError extends Error {
  constructor() {
    super('A trusted tenant context is required for knowledge and media operations.');
    this.name = 'TenantContextRequiredError';
  }
}

export class EmbeddingDimensionsRequiredError extends Error {
  constructor(modelId: string) {
    super(
      `Embedding model "${modelId}" must declare embeddingDimensions before it can ingest knowledge.`,
    );
    this.name = 'EmbeddingDimensionsRequiredError';
  }
}

export function executableCapabilities(
  bindings: AiOrchestratorBindings,
): readonly CapabilityKind[] {
  const providers = createProviderRegistry(bindings);
  const direct = new Set<CapabilityKind>();
  const embeddingModels: ModelDescriptor[] = [];

  for (const provider of providers.list()) {
    const models = provider.listModels();

    if (models instanceof Promise) {
      continue;
    }

    for (const model of models) {
      for (const capability of model.capabilities) {
        direct.add(capability);
      }

      if (model.capabilities.includes('embedding')) {
        embeddingModels.push(model);
      }
    }
  }

  if (bindings.AI_CODE_SANDBOX) {
    direct.add('tool');
  }

  if (!bindings.AI_ARTIFACTS) {
    direct.delete('image');
    direct.delete('audio');
    direct.delete('video');
    direct.delete('music');
  }

  if (embeddingModels.length > 0 && vectorStoreStatus(bindings).configured) {
    direct.add('retrieval');

    if (
      embeddingModels.some(
        (model) =>
          Number.isInteger(model.embeddingDimensions) &&
          (model.embeddingDimensions ?? 0) > 0,
      )
    ) {
      direct.add('knowledge-ingest');
    }
  }

  return capabilityKinds.filter((capability) => direct.has(capability));
}

export async function executeOrchestrationRequest(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
  context: { runId?: string } = {},
): Promise<OrchestrationOutput> {
  switch (request.capability) {
    case 'code':
      if (
        codeRequestNeedsSandbox(
          request.input as CodeGenerationInput,
        )
      ) {
        return executeCodeAgent(
          bindings,
          request,
          context.runId ?? crypto.randomUUID(),
        );
      }
      break;
    case 'knowledge-ingest':
      return executeKnowledgeIngestion(bindings, request);
    case 'retrieval':
      return executeRetrieval(bindings, request);
    case 'tool':
      return executeToolRequest(bindings, request);
    default:
      break;
  }

  const providers = createProviderRegistry(bindings);
  const executor = new OrchestrationExecutor(
    providers,
    new CapabilityRoutingPolicy(),
  );
  const output = await executor.execute(request);

  if (
    request.capability === 'image' ||
    request.capability === 'audio' ||
    request.capability === 'video' ||
    request.capability === 'music'
  ) {
    return materializeGeneratedBinary(bindings, request, output);
  }

  return output;
}

async function materializeGeneratedBinary(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
  output: OrchestrationOutput,
): Promise<OrchestrationOutput> {
  const tenantId = requireTenantId(request);
  const generated = output.content as GeneratedBinary;

  if (
    !generated ||
    !['image', 'audio', 'video', 'music'].includes(generated.kind) ||
    typeof generated.contentType !== 'string' ||
    (!('data' in generated) && !('url' in generated))
  ) {
    throw new Error('The media provider returned an invalid binary result.');
  }

  const artifacts = createArtifactStore(bindings);
  if (!artifacts) {
    throw new ArtifactStoreUnavailableError();
  }

  const body = await resolveGeneratedMediaBody(generated);

  const reference = await artifacts.put(`user:${tenantId}`, {
    kind: generated.kind,
    contentType: generated.contentType,
    body,
    metadata: {
      providerId: output.providerId,
      modelId: output.modelId,
      capability: request.capability,
    },
  });

  const content: MediaGenerationOutput = {
    artifacts: [reference],
  };

  return {
    ...output,
    content,
    artifacts: [reference.id],
  };
}

async function resolveGeneratedMediaBody(
  generated: GeneratedBinary,
): Promise<ArrayBuffer | ReadableStream<Uint8Array>> {
  if ('data' in generated && generated.data) {
    return generated.data;
  }

  if (!('url' in generated) || !generated.url) {
    throw new Error('The media provider returned no artifact body.');
  }

  let source = validateGeneratedMediaUrl(generated.url);
  let response: Response | undefined;

  for (
    let redirectCount = 0;
    redirectCount <= MAX_GENERATED_MEDIA_REDIRECTS;
    redirectCount += 1
  ) {
    response = await fetch(source, {
      redirect: 'manual',
      cf: {
        cacheTtl: 0,
        cacheEverything: false,
      },
    });

    if (
      response.status < 300 ||
      response.status >= 400
    ) {
      break;
    }

    if (redirectCount === MAX_GENERATED_MEDIA_REDIRECTS) {
      throw new Error('Generated media exceeded the redirect limit.');
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new Error('Generated media redirect did not include a location.');
    }

    source = validateGeneratedMediaUrl(
      new URL(location, source).toString(),
    );
  }

  if (!response || !response.ok || !response.body) {
    throw new Error(
      `Failed to download generated media (HTTP ${response?.status ?? 0}).`,
    );
  }

  const contentLength = response.headers.get('content-length');
  if (
    contentLength &&
    Number.parseInt(contentLength, 10) > MAX_GENERATED_MEDIA_BYTES
  ) {
    throw new Error('Generated media exceeds the 512 MiB artifact limit.');
  }

  return enforceStreamByteLimit(
    response.body,
    MAX_GENERATED_MEDIA_BYTES,
  );
}

function validateGeneratedMediaUrl(value: string): URL {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    isPrivateGeneratedMediaHost(hostname)
  ) {
    throw new Error('Generated media URL is not allowed.');
  }

  return url;
}

function isPrivateGeneratedMediaHost(hostname: string): boolean {
  if (hostname === '::1' || hostname === '[::1]') return true;

  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u.exec(
    hostname,
  );
  if (!match) return false;

  const octets = match.slice(1).map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) return true;

  const [a, b] = octets;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b !== undefined && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function enforceStreamByteLimit(
  body: ReadableStream<Uint8Array>,
  limitBytes: number,
): ReadableStream<Uint8Array> {
  let total = 0;

  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        total += chunk.byteLength;
        if (total > limitBytes) {
          throw new Error(
            'Generated media exceeds the 512 MiB artifact limit.',
          );
        }

        controller.enqueue(chunk);
      },
    }),
  );
}

async function executeKnowledgeIngestion(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
): Promise<OrchestrationOutput> {
  const tenantId = requireTenantId(request);
  const vectorStore = await createVectorStore(bindings);

  if (!vectorStore) {
    throw new VectorStoreUnavailableError();
  }

  const input = request.input as KnowledgeIngestionInput;
  const namespace = createTenantKnowledgeNamespace(
    tenantId,
    input.namespace,
  );
  const embeddings = await createRoutingEmbeddingGenerator(
    bindings,
    request,
  );
  const chunker = new FixedWindowTextChunker({
    ...(input.chunking?.maxCharacters === undefined
      ? {}
      : { maxCharacters: input.chunking.maxCharacters }),
    ...(input.chunking?.overlapCharacters === undefined
      ? {}
      : { overlapCharacters: input.chunking.overlapCharacters }),
  });
  const service = new KnowledgeIngestionService(
    chunker,
    embeddings,
    vectorStore,
    vectorStore,
  );

  const result = await service.ingest({
    namespace,
    documents: input.documents,
  });

  const content: KnowledgeIngestionOutput = {
    namespace: input.namespace,
    documentsProcessed: result.documentsProcessed,
    chunksWritten: result.chunksWritten,
    embeddingModelId: result.embeddingModelId,
  };

  return {
    content,
    providerId: embeddings.providerId,
    modelId: result.embeddingModelId,
    ...(embeddings.usage ? { usage: embeddings.usage } : {}),
  };
}

async function executeRetrieval(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
): Promise<OrchestrationOutput> {
  const tenantId = requireTenantId(request);
  const vectorStore = await createVectorStore(bindings);

  if (!vectorStore) {
    throw new VectorStoreUnavailableError();
  }

  const input = request.input as RetrievalInput;
  const namespace = createTenantKnowledgeNamespace(
    tenantId,
    input.namespace,
  );
  const embeddings = await createRoutingEmbeddingGenerator(
    bindings,
    request,
  );
  const [vector] = await embeddings.embed([input.query]);

  if (!vector || vector.length === 0) {
    throw new Error('Embedding provider returned no retrieval query vector.');
  }

  const requestedLimit = input.limit ?? 10;
  const candidateLimit = input.rerank
    ? Math.min(Math.max(requestedLimit * 3, requestedLimit), 100)
    : requestedLimit;

  const vectorMatches = await vectorStore.search({
    namespace,
    vector,
    limit: candidateLimit,
    ...(input.filter === undefined ? {} : { filter: input.filter }),
  });

  const reranked = input.rerank
    ? await rerankMatches(
        bindings,
        request,
        input.query,
        vectorMatches,
        requestedLimit,
      )
    : {
        matches: vectorMatches.slice(0, requestedLimit),
        usage: undefined,
      };

  const content: RetrievalOutput = {
    matches: reranked.matches,
  };
  const usage = mergeUsage(embeddings.usage, reranked.usage);

  return {
    content,
    providerId: embeddings.providerId,
    modelId: embeddings.modelId,
    ...(usage ? { usage } : {}),
  };
}

async function rerankMatches(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
  query: string,
  matches: readonly RetrievalMatch[],
  limit: number,
): Promise<{
  matches: readonly RetrievalMatch[];
  usage?: Usage;
}> {
  const documents = matches
    .filter((match): match is RetrievalMatch & { text: string } =>
      typeof match.text === 'string' && match.text.length > 0,
    )
    .map((match) => ({
      id: match.id,
      text: match.text,
    }));

  if (documents.length === 0) {
    return { matches: matches.slice(0, limit) };
  }

  const rerankRequest: OrchestrationRequest = {
    ...request,
    capability: 'rerank',
    input: {
      query,
      documents,
      limit,
    },
  };
  const reranked = await new OrchestrationExecutor(
    createProviderRegistry(bindings),
    new CapabilityRoutingPolicy(),
  ).execute(rerankRequest);
  const output = reranked.content as RerankOutput;
  const byId = new Map(matches.map((match) => [match.id, match]));

  return {
    matches: output.results
      .map((result) => {
        const match = byId.get(result.id);
        return match
          ? {
              ...match,
              score: result.score,
            }
          : undefined;
      })
      .filter((match): match is RetrievalMatch => Boolean(match))
      .slice(0, limit),
    ...(reranked.usage ? { usage: reranked.usage } : {}),
  };
}

class RoutingEmbeddingGenerator implements EmbeddingGenerator {
  private activeProviderId: string;
  private activeModelId: string;
  private activeUsage: Usage | undefined;

  constructor(
    private readonly targets: readonly {
      provider: ModelProvider;
      model: ModelDescriptor;
    }[],
    readonly dimensions: number,
    private readonly request: OrchestrationRequest,
  ) {
    const primary = targets[0];
    if (!primary) {
      throw new Error('No embedding route is available.');
    }

    this.activeProviderId = primary.provider.id;
    this.activeModelId = primary.model.id;
  }

  get providerId(): string {
    return this.activeProviderId;
  }

  get modelId(): string {
    return this.activeModelId;
  }

  get usage(): Usage | undefined {
    return this.activeUsage;
  }

  async embed(
    texts: readonly string[],
  ): Promise<readonly (readonly number[])[]> {
    const failures: Array<{
      providerId: string;
      modelId: string;
      error: unknown;
    }> = [];

    for (const target of this.targets) {
      try {
        const result = await target.provider.execute(
          {
            ...this.request,
            capability: 'embedding',
            input: { texts },
            preferences: embeddingPreferences(this.request),
          },
          target.model,
        );
        const content = result.content as EmbeddingOutput;

        if (
          !content ||
          !Array.isArray(content.vectors) ||
          content.dimensions !== this.dimensions ||
          content.vectors.length !== texts.length ||
          content.vectors.some(
            (vector) => vector.length !== this.dimensions,
          )
        ) {
          throw new Error(
            `Embedding model "${target.model.id}" returned an unexpected vector shape.`,
          );
        }

        this.activeProviderId = result.providerId;
        this.activeModelId = result.modelId;
        this.activeUsage = result.usage;
        return content.vectors;
      } catch (error) {
        failures.push({
          providerId: target.provider.id,
          modelId: target.model.id,
          error,
        });
      }
    }

    throw new ProviderExecutionError(
      `All ${this.targets.length} eligible embedding route(s) failed.`,
      failures,
    );
  }
}

async function createRoutingEmbeddingGenerator(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
): Promise<RoutingEmbeddingGenerator> {
  const providers = createProviderRegistry(bindings);
  const routing = new CapabilityRoutingPolicy();
  const candidates = (await providers.modelsFor('embedding')).filter(
    (model) =>
      Number.isInteger(model.embeddingDimensions) &&
      (model.embeddingDimensions ?? 0) > 0,
  );
  const embeddingRequest: OrchestrationRequest = {
    ...request,
    capability: 'embedding',
    input: { texts: ['routing-probe'] },
    preferences: embeddingPreferences(request),
  };
  const ranked = routing.rank(embeddingRequest, candidates);
  const selectedRoutes =
    request.preferences?.allowFallback === false
      ? ranked.slice(0, 1)
      : ranked;
  const primaryRoute = selectedRoutes[0];

  if (!primaryRoute) {
    throw new Error('No embedding route is available.');
  }

  const primaryModel = candidates.find(
    (candidate) =>
      candidate.providerId === primaryRoute.providerId &&
      candidate.id === primaryRoute.modelId,
  );
  const dimensions = primaryModel?.embeddingDimensions;

  if (!primaryModel || !dimensions) {
    throw new EmbeddingDimensionsRequiredError(
      primaryRoute.modelId,
    );
  }

  const targets: Array<{
    provider: ModelProvider;
    model: ModelDescriptor;
  }> = [];

  for (const route of selectedRoutes) {
    const provider = providers.get(route.providerId);
    if (!provider) continue;

    const models = await provider.listModels();
    const model = models.find(
      (candidate) =>
        candidate.id === route.modelId &&
        candidate.embeddingDimensions === dimensions,
    );

    if (model) {
      targets.push({ provider, model });
    }
  }

  if (targets.length === 0) {
    throw new Error('No compatible embedding route is available.');
  }

  return new RoutingEmbeddingGenerator(
    targets,
    dimensions,
    embeddingRequest,
  );
}

function mergeUsage(
  left: Usage | undefined,
  right: Usage | undefined,
): Usage | undefined {
  if (!left && !right) return undefined;

  const sum = (
    first: number | undefined,
    second: number | undefined,
  ): number | undefined =>
    first === undefined && second === undefined
      ? undefined
      : (first ?? 0) + (second ?? 0);

  const inputUnits = sum(left?.inputUnits, right?.inputUnits);
  const outputUnits = sum(left?.outputUnits, right?.outputUnits);
  const totalUnits = sum(left?.totalUnits, right?.totalUnits);
  const estimatedCostUsd = sum(
    left?.estimatedCostUsd,
    right?.estimatedCostUsd,
  );

  return {
    ...(inputUnits === undefined ? {} : { inputUnits }),
    ...(outputUnits === undefined ? {} : { outputUnits }),
    ...(totalUnits === undefined ? {} : { totalUnits }),
    ...(estimatedCostUsd === undefined
      ? {}
      : { estimatedCostUsd }),
  };
}

function embeddingPreferences(
  request: OrchestrationRequest,
): OrchestrationRequest['preferences'] {
  const provider = request.preferences?.provider;
  const allowFallback = request.preferences?.allowFallback;

  if (provider === undefined && allowFallback === undefined) {
    return undefined;
  }

  return {
    ...(provider === undefined ? {} : { provider }),
    ...(allowFallback === undefined ? {} : { allowFallback }),
  };
}

function requireTenantId(request: OrchestrationRequest): string {
  if (!request.tenantId) {
    throw new TenantContextRequiredError();
  }

  return request.tenantId;
}

function createTenantKnowledgeNamespace(
  tenantId: string,
  namespace: string,
): string {
  return `user:${tenantId}:knowledge:${namespace.trim()}`;
}
