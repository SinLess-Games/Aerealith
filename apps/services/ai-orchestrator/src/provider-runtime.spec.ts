import {
  createProviderRegistry,
  modelRuntimeCatalog,
  ProviderCatalogConfigurationError,
  providerRuntimeStatus,
} from './provider-runtime';

describe('AI provider runtime', () => {
  it('registers Cloudflare Workers AI as the built-in provider', () => {
    const AI = {
      run: vi.fn(async () => ({ response: 'ok' })),
    };

    const registry = createProviderRegistry({ AI });
    const status = providerRuntimeStatus({ AI });

    expect(registry.get('cloudflare-workers-ai')).toBeDefined();
    expect(status).toMatchObject({
      configuredProviders: 1,
      totalProviders: 1,
      providers: [
        {
          id: 'cloudflare-workers-ai',
          kind: 'cloudflare-workers-ai',
          configured: true,
        },
      ],
    });
    expect(status.capabilities).toEqual([
      'text',
      'code',
      'embedding',
      'rerank',
      'image',
      'audio',
      'analytics',
      'prediction',
    ]);
  });

  it('registers configured OpenAI-compatible providers', () => {
    const bindings = {
      AI_PROVIDER_CATALOG: JSON.stringify([
        {
          id: 'primary',
          kind: 'openai-compatible',
          baseUrl: 'https://models.example.test/v1',
          apiKeyBinding: 'PRIMARY_MODEL_API_KEY',
          models: [
            {
              id: 'chat-model',
              capabilities: ['text', 'code'],
              priority: 100,
            },
            {
              id: 'embedding-model',
              capabilities: ['embedding'],
              priority: 100,
            },
          ],
        },
      ]),
      PRIMARY_MODEL_API_KEY: 'secret',
    };

    const registry = createProviderRegistry(bindings);
    const status = providerRuntimeStatus(bindings);

    expect(registry.list()).toHaveLength(1);
    expect(registry.get('primary')).toBeDefined();
    expect(status).toEqual({
      configuredProviders: 1,
      totalProviders: 1,
      capabilities: ['text', 'code', 'embedding'],
      providers: [
        {
          id: 'primary',
          kind: 'openai-compatible',
          configured: true,
          modelCount: 2,
          capabilities: ['text', 'code', 'embedding'],
        },
      ],
    });
    expect(JSON.stringify(status)).not.toContain('secret');
    expect(JSON.stringify(status)).not.toContain('models.example.test');
  });

  it('returns a safe model catalog for UI model selection', async () => {
    const AI = {
      run: vi.fn(async () => ({ response: 'ok' })),
    };

    const models = await modelRuntimeCatalog({ AI });

    expect(models).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          providerId: 'cloudflare-workers-ai',
          id: '@cf/zai-org/glm-4.7-flash',
          capabilities: expect.arrayContaining(['text']),
        }),
        expect.objectContaining({
          providerId: 'cloudflare-workers-ai',
          id: '@cf/qwen/qwen3-embedding-0.6b',
          embeddingDimensions: 1024,
        }),
      ]),
    );
    expect(JSON.stringify(models)).not.toContain('baseUrl');
    expect(JSON.stringify(models)).not.toContain('apiKey');
  });

  it('does not register a provider whose required secret is missing', () => {
    const bindings = {
      AI_PROVIDER_CATALOG: JSON.stringify([
        {
          id: 'primary',
          kind: 'openai-compatible',
          baseUrl: 'https://models.example.test/v1',
          apiKeyBinding: 'PRIMARY_MODEL_API_KEY',
          models: [
            {
              id: 'chat-model',
              capabilities: ['text'],
            },
          ],
        },
      ]),
    };

    expect(createProviderRegistry(bindings).list()).toHaveLength(0);
    expect(providerRuntimeStatus(bindings)).toMatchObject({
      configuredProviders: 0,
      totalProviders: 1,
      capabilities: [],
      providers: [{ id: 'primary', configured: false }],
    });
  });

  it('rejects duplicate provider ids', () => {
    const bindings = {
      AI_PROVIDER_CATALOG: JSON.stringify([
        {
          id: 'duplicate',
          kind: 'openai-compatible',
          baseUrl: 'https://one.example.test/v1',
          models: [{ id: 'one', capabilities: ['text'] }],
        },
        {
          id: 'duplicate',
          kind: 'openai-compatible',
          baseUrl: 'https://two.example.test/v1',
          models: [{ id: 'two', capabilities: ['text'] }],
        },
      ]),
    };

    expect(() => createProviderRegistry(bindings)).toThrow(
      ProviderCatalogConfigurationError,
    );
  });
});
