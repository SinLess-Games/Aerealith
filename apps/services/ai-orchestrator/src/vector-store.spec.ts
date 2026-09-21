import {
  createVectorStore,
  vectorStoreStatus,
} from './vector-store';

describe('AI orchestrator vector-store runtime', () => {
  it('stays disabled until endpoint and credentials are both configured', async () => {
    expect(
      vectorStoreStatus({
        QDRANT_URL: 'https://qdrant.example.test',
      }),
    ).toEqual({
      provider: 'qdrant',
      configured: false,
      endpointConfigured: true,
      credentialsConfigured: false,
      collection: 'aerealith-knowledge-v1',
    });

    await expect(
      createVectorStore({
        QDRANT_URL: 'https://qdrant.example.test',
      }),
    ).resolves.toBeUndefined();
  });

  it('creates the Qdrant adapter from a Secrets Store binding', async () => {
    const get = vi.fn(async () => 'test-key');
    const bindings = {
      QDRANT_URL: 'https://qdrant.example.test',
      QDRANT_API_KEY: { get },
      QDRANT_COLLECTION: 'aerealith-test-knowledge',
    };

    await expect(createVectorStore(bindings)).resolves.toBeDefined();
    expect(get).toHaveBeenCalledTimes(1);
    expect(vectorStoreStatus(bindings)).toEqual({
      provider: 'qdrant',
      configured: true,
      endpointConfigured: true,
      credentialsConfigured: true,
      collection: 'aerealith-test-knowledge',
    });
  });

  it('retains plain-string support for local tests and development', async () => {
    await expect(
      createVectorStore({
        QDRANT_URL: 'https://qdrant.example.test',
        QDRANT_API_KEY: 'local-test-key',
      }),
    ).resolves.toBeDefined();
  });
});
