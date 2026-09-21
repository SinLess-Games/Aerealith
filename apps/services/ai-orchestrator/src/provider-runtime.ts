import {
  CloudflareWorkersAiProvider,
  cloudflareWorkersAiModelCatalog,
} from '@aerealith-ai/ai-cloudflare-workers';
import {
  capabilityKinds,
  InMemoryProviderRegistry,
  type CapabilityKind,
  type ModelDescriptor,
} from '@aerealith-ai/ai-orchestration';
import { OpenAiCompatibleProvider } from '@aerealith-ai/ai-openai-compatible';
import { z } from 'zod';

import type { AiOrchestratorBindings } from './bindings';

const openAiCompatibleCapabilities = [
  'text',
  'code',
  'embedding',
] as const satisfies readonly CapabilityKind[];

const modelSchema = z.object({
  id: z.string().min(1).max(256),
  capabilities: z.array(z.enum(openAiCompatibleCapabilities)).min(1),
  priority: z.number().int().optional(),
  supportsStreaming: z.boolean().optional(),
  contextWindow: z.number().int().positive().optional(),
  embeddingDimensions: z.number().int().positive().max(100_000).optional(),
  inputCostPerMillionUnitsUsd: z.number().nonnegative().optional(),
  outputCostPerMillionUnitsUsd: z.number().nonnegative().optional(),
});

const providerSchema = z.object({
  id: z.string().min(1).max(128),
  kind: z.literal('openai-compatible'),
  baseUrl: z.url(),
  apiKeyBinding: z.string().min(1).max(128).optional(),
  models: z.array(modelSchema).min(1),
});

const providerCatalogSchema = z.array(providerSchema);

export type ProviderRuntimeStatus = {
  configuredProviders: number;
  totalProviders: number;
  capabilities: readonly CapabilityKind[];
  providers: readonly {
    id: string;
    kind: 'cloudflare-workers-ai' | 'openai-compatible';
    configured: boolean;
    modelCount: number;
    capabilities: readonly CapabilityKind[];
  }[];
};

export class ProviderCatalogConfigurationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ProviderCatalogConfigurationError';
  }
}

export function createProviderRegistry(
  bindings: AiOrchestratorBindings,
): InMemoryProviderRegistry {
  const registry = new InMemoryProviderRegistry();

  if (bindings.AI) {
    registry.register(
      new CloudflareWorkersAiProvider(bindings.AI),
    );
  }

  const catalog = parseProviderCatalog(bindings);

  for (const provider of catalog) {
    const apiKey = provider.apiKeyBinding
      ? readPlainStringBinding(bindings, provider.apiKeyBinding)
      : undefined;

    if (provider.apiKeyBinding && !apiKey) {
      continue;
    }

    const models: ModelDescriptor[] = provider.models.map((model) => ({
      ...model,
      providerId: provider.id,
    }));

    registry.register(
      new OpenAiCompatibleProvider({
        id: provider.id,
        baseUrl: provider.baseUrl,
        apiKey,
        models,
      }),
    );
  }

  return registry;
}

export function providerRuntimeStatus(
  bindings: AiOrchestratorBindings,
): ProviderRuntimeStatus {
  const providers: ProviderRuntimeStatus['providers'][number][] = [];

  if (bindings.AI) {
    providers.push({
      id: 'cloudflare-workers-ai',
      kind: 'cloudflare-workers-ai',
      configured: true,
      modelCount: cloudflareWorkersAiModelCatalog.length,
      capabilities: uniqueCapabilities(
        cloudflareWorkersAiModelCatalog.flatMap(
          (model) => model.capabilities,
        ),
      ),
    });
  }

  const catalog = parseProviderCatalog(bindings);

  for (const provider of catalog) {
    const configured =
      !provider.apiKeyBinding ||
      Boolean(readPlainStringBinding(bindings, provider.apiKeyBinding));

    providers.push({
      id: provider.id,
      kind: provider.kind,
      configured,
      modelCount: provider.models.length,
      capabilities: uniqueCapabilities(
        provider.models.flatMap((model) => model.capabilities),
      ),
    });
  }

  return {
    configuredProviders: providers.filter((provider) => provider.configured)
      .length,
    totalProviders: providers.length,
    capabilities: uniqueCapabilities(
      providers
        .filter((provider) => provider.configured)
        .flatMap((provider) => provider.capabilities),
    ),
    providers,
  };
}

function parseProviderCatalog(bindings: AiOrchestratorBindings) {
  const raw = bindings.AI_PROVIDER_CATALOG?.trim();
  if (!raw) return [];

  let value: unknown;

  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new ProviderCatalogConfigurationError(
      'AI_PROVIDER_CATALOG must contain valid JSON.',
      { cause: error },
    );
  }

  const parsed = providerCatalogSchema.safeParse(value);
  if (!parsed.success) {
    throw new ProviderCatalogConfigurationError(
      'AI_PROVIDER_CATALOG does not match the provider catalog schema.',
      { cause: parsed.error },
    );
  }

  const ids = new Set<string>();
  for (const provider of parsed.data) {
    if (provider.id === 'cloudflare-workers-ai') {
      throw new ProviderCatalogConfigurationError(
        'The provider id "cloudflare-workers-ai" is reserved.',
      );
    }

    if (ids.has(provider.id)) {
      throw new ProviderCatalogConfigurationError(
        `AI_PROVIDER_CATALOG contains duplicate provider id "${provider.id}".`,
      );
    }

    ids.add(provider.id);
  }

  return parsed.data;
}

function readPlainStringBinding(
  bindings: AiOrchestratorBindings,
  name: string,
): string | undefined {
  const value = (bindings as unknown as Record<string, unknown>)[name];

  return typeof value === 'string' && value.trim()
    ? value.trim()
    : undefined;
}

function uniqueCapabilities(
  capabilities: readonly CapabilityKind[],
): CapabilityKind[] {
  return [...new Set(capabilities)].sort(
    (left, right) =>
      capabilityKinds.indexOf(left) - capabilityKinds.indexOf(right),
  );
}
