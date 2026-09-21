import {
  executeOrchestrationRequest,
  executableCapabilities,
  VectorStoreUnavailableError,
} from './execution-runtime';

function configuredBindings() {
  return {
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
    PRIMARY_MODEL_API_KEY: 'provider-secret',
    QDRANT_URL: 'https://qdrant.example.test',
    QDRANT_API_KEY: 'qdrant-secret',
    QDRANT_COLLECTION: 'aerealith-knowledge-v1',
  };
}

describe('AI execution runtime', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes retrieval when embeddings and Qdrant are configured', () => {
    expect(executableCapabilities(configuredBindings())).toEqual([
      'text',
      'code',
      'embedding',
      'retrieval',
    ]);
  });

  it('embeds retrieval queries and searches the isolated Qdrant namespace', async () => {
    const fetchImplementation = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url === 'https://models.example.test/v1/embeddings') {
          return new Response(
            JSON.stringify({
              data: [{ index: 0, embedding: [0.1, 0.2, 0.3] }],
              usage: {
                prompt_tokens: 4,
                total_tokens: 4,
              },
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            },
          );
        }

        if (
          url ===
          'https://qdrant.example.test/collections/aerealith-knowledge-v1/points/query'
        ) {
          const body = JSON.parse(String(init?.body)) as {
            filter: {
              must: Array<Record<string, unknown>>;
            };
          };

          expect(body.filter.must[0]).toEqual({
            key: 'namespace',
            match: { value: 'user:user-123:knowledge:tenant-a:knowledge' },
          });

          return new Response(
            JSON.stringify({
              result: {
                points: [
                  {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    score: 0.98,
                    payload: {
                      namespace: 'tenant-a:knowledge',
                      record_id: 'doc-1:0',
                      text: 'Aerealith retrieval result',
                      metadata: {
                        documentId: 'doc-1',
                      },
                    },
                  },
                ],
              },
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            },
          );
        }

        throw new Error(`Unexpected fetch: ${url}`);
      },
    );

    vi.stubGlobal('fetch', fetchImplementation);

    const result = await executeOrchestrationRequest(
      configuredBindings(),
      {
        capability: 'retrieval',
        tenantId: 'user-123',
        actorId: 'user-123',
        input: {
          namespace: 'tenant-a:knowledge',
          query: 'What is Aerealith?',
          limit: 5,
        },
      },
    );

    expect(result).toMatchObject({
      providerId: 'primary',
      modelId: 'embedding-model',
      content: {
        matches: [
          {
            id: 'doc-1:0',
            score: 0.98,
            text: 'Aerealith retrieval result',
          },
        ],
      },
      usage: {
        inputUnits: 4,
        totalUnits: 4,
      },
    });

    expect(fetchImplementation).toHaveBeenCalledTimes(2);
  });

  it('does not advertise retrieval without Qdrant credentials', () => {
    const bindings = configuredBindings();
    delete (bindings as { QDRANT_API_KEY?: string }).QDRANT_API_KEY;

    expect(executableCapabilities(bindings)).toEqual([
      'text',
      'code',
      'embedding',
    ]);
  });

  it('rejects retrieval execution when the vector store is unavailable', async () => {
    const bindings = configuredBindings();
    delete (bindings as { QDRANT_API_KEY?: string }).QDRANT_API_KEY;

    await expect(
      executeOrchestrationRequest(bindings, {
        capability: 'retrieval',
        input: {
          namespace: 'tenant-a:knowledge',
          query: 'hello',
        },
      }),
    ).rejects.toBeInstanceOf(VectorStoreUnavailableError);
  });
});
