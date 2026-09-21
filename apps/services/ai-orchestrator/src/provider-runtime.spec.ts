import {
  createProviderRegistry,
  ProviderCatalogConfigurationError,
  providerRuntimeStatus,
} from './provider-runtime';

describe('AI provider runtime', () => {
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
