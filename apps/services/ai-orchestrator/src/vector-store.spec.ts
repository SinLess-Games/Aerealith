import {
  createVectorStore,
  vectorStoreStatus,
} from './vector-store';

describe('AI orchestrator vector-store runtime', () => {
  it('stays disabled until endpoint and credentials are both configured', () => {
    expect(
      vectorStoreStatus({
        QDRANT_URL: 'https://qdrant.example.test',
      }),
    ).toEqual({
      provider: 'qdrant',
      configured: false,
      endpointConfigured: true,
      credentialsConfigured: false,
      collectionPrefix: 'aerealith-',
    });

    expect(
      createVectorStore({
        QDRANT_URL: 'https://qdrant.example.test',
      }),
    ).toBeUndefined();
  });

  it('creates the Qdrant adapter when configuration is complete', () => {
    const bindings = {
      QDRANT_URL: 'https://qdrant.example.test',
      QDRANT_API_KEY: 'test-key',
      QDRANT_COLLECTION_PREFIX: 'aerealith-test-',
    };

    expect(createVectorStore(bindings)).toBeDefined();
    expect(vectorStoreStatus(bindings)).toEqual({
      provider: 'qdrant',
      configured: true,
      endpointConfigured: true,
      credentialsConfigured: true,
      collectionPrefix: 'aerealith-test-',
    });
  });
});
