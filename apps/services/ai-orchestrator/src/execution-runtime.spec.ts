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
            embeddingDimensions: 3,
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
      'knowledge-ingest',
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
                      namespace: 'user:user-123:knowledge:tenant-a:knowledge',
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

  it('falls back to a compatible embedding provider for retrieval', async () => {
    const bindings = {
      AI_PROVIDER_CATALOG: JSON.stringify([
        {
          id: 'primary',
          kind: 'openai-compatible',
          baseUrl: 'https://primary.example.test/v1',
          models: [
            {
              id: 'embed-primary',
              capabilities: ['embedding'],
              priority: 100,
              embeddingDimensions: 3,
            },
          ],
        },
        {
          id: 'backup',
          kind: 'openai-compatible',
          baseUrl: 'https://backup.example.test/v1',
          models: [
            {
              id: 'embed-backup',
              capabilities: ['embedding'],
              priority: 50,
              embeddingDimensions: 3,
            },
          ],
        },
      ]),
      QDRANT_URL: 'https://qdrant.example.test',
      QDRANT_API_KEY: 'qdrant-secret',
      QDRANT_COLLECTION: 'aerealith-knowledge-v1',
    };

    const fetchImplementation = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url === 'https://primary.example.test/v1/embeddings') {
          return Response.json(
            { error: { message: 'primary unavailable' } },
            { status: 503 },
          );
        }

        if (url === 'https://backup.example.test/v1/embeddings') {
          return Response.json({
            data: [{ index: 0, embedding: [0.3, 0.2, 0.1] }],
            usage: {
              prompt_tokens: 7,
              total_tokens: 7,
            },
          });
        }

        if (
          url ===
          'https://qdrant.example.test/collections/aerealith-knowledge-v1/points/query'
        ) {
          return Response.json({
            result: {
              points: [],
            },
          });
        }

        throw new Error(
          `Unexpected fetch: ${url} ${init?.method ?? 'GET'}`,
        );
      },
    );
    vi.stubGlobal('fetch', fetchImplementation);

    const result = await executeOrchestrationRequest(bindings, {
      capability: 'retrieval',
      tenantId: 'user-123',
      actorId: 'user-123',
      preferences: {
        provider: 'primary',
        allowFallback: true,
      },
      input: {
        namespace: 'kb-1',
        query: 'fallback please',
      },
    });

    expect(result).toMatchObject({
      providerId: 'backup',
      modelId: 'embed-backup',
      usage: {
        inputUnits: 7,
        totalUnits: 7,
      },
      content: {
        matches: [],
      },
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(3);
  });

  it('chunks, embeds, provisions, and writes tenant-isolated knowledge', async () => {
    const fetchImplementation = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url === 'https://models.example.test/v1/embeddings') {
          return new Response(
            JSON.stringify({
              data: [{ index: 0, embedding: [0.1, 0.2, 0.3] }],
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            },
          );
        }

        if (
          url ===
            'https://qdrant.example.test/collections/aerealith-knowledge-v1' &&
          init?.method === 'GET'
        ) {
          return new Response(null, { status: 404 });
        }

        if (
          url ===
            'https://qdrant.example.test/collections/aerealith-knowledge-v1' &&
          init?.method === 'PUT'
        ) {
          expect(JSON.parse(String(init.body))).toEqual({
            vectors: {
              size: 3,
              distance: 'Cosine',
            },
          });

          return Response.json({ result: true, status: 'ok' });
        }

        if (
          url ===
          'https://qdrant.example.test/collections/aerealith-knowledge-v1/index?wait=true'
        ) {
          expect(JSON.parse(String(init?.body))).toEqual({
            field_name: 'namespace',
            field_schema: {
              type: 'keyword',
              is_tenant: true,
            },
          });

          return Response.json({ result: true, status: 'ok' });
        }

        if (
          url ===
          'https://qdrant.example.test/collections/aerealith-knowledge-v1/points/batch?wait=true&ordering=strong'
        ) {
          const body = JSON.parse(String(init?.body)) as {
            operations: Array<{
              delete?: { filter?: unknown };
              upsert?: {
                points?: Array<{
                  payload: {
                    namespace: string;
                    record_id: string;
                    metadata: Record<string, unknown>;
                  };
                }>;
              };
            }>;
          };

          expect(body.operations[0]).toMatchObject({
            delete: {
              filter: {
                must: [
                  {
                    key: 'namespace',
                    match: {
                      value: 'user:user-123:knowledge:kb-1',
                    },
                  },
                  {
                    key: 'metadata.documentId',
                    match: { value: 'doc-1' },
                  },
                ],
              },
            },
          });
          expect(body.operations[1]?.upsert?.points?.[0]?.payload).toMatchObject({
            namespace: 'user:user-123:knowledge:kb-1',
            record_id: 'doc-1:0',
            metadata: {
              source: 'docs',
              documentId: 'doc-1',
            },
          });

          return Response.json({ status: 'ok' });
        }

        throw new Error(`Unexpected fetch: ${url} ${init?.method ?? 'GET'}`);
      },
    );

    vi.stubGlobal('fetch', fetchImplementation);

    const result = await executeOrchestrationRequest(
      configuredBindings(),
      {
        capability: 'knowledge-ingest',
        tenantId: 'user-123',
        actorId: 'user-123',
        input: {
          namespace: 'kb-1',
          documents: [
            {
              id: 'doc-1',
              text: 'Aerealith documentation',
              metadata: {
                source: 'docs',
                documentId: 'attacker-value',
              },
            },
          ],
        },
      },
    );

    expect(result).toMatchObject({
      providerId: 'primary',
      modelId: 'embedding-model',
      content: {
        namespace: 'kb-1',
        documentsProcessed: 1,
        chunksWritten: 1,
        embeddingModelId: 'embedding-model',
      },
    });

    expect(fetchImplementation).toHaveBeenCalledTimes(5);
  });

  it('rejects unsafe generated-media URLs before artifact persistence', async () => {
    const AI = {
      run: vi.fn(async () => ({
        result: {
          video: 'https://127.0.0.1/private.mp4',
        },
      })),
    };

    await expect(
      executeOrchestrationRequest(
        {
          AI,
          AI_ARTIFACTS: {} as R2Bucket,
        },
        {
          capability: 'video',
          tenantId: 'user-123',
          actorId: 'user-123',
          input: {
            prompt: 'A safe test video',
          },
        },
      ),
    ).rejects.toThrow('Generated media URL is not allowed.');
  });

  it('rejects generated-media redirects to private hosts', async () => {
    const AI = {
      run: vi.fn(async () => ({
        result: {
          video: 'https://media.example.test/video.mp4',
        },
      })),
    };
    const fetchImplementation = vi.fn(async () =>
      new Response(null, {
        status: 302,
        headers: {
          location: 'https://127.0.0.1/private.mp4',
        },
      }),
    );
    vi.stubGlobal('fetch', fetchImplementation);

    await expect(
      executeOrchestrationRequest(
        {
          AI,
          AI_ARTIFACTS: {} as R2Bucket,
        },
        {
          capability: 'video',
          tenantId: 'user-123',
          actorId: 'user-123',
          input: {
            prompt: 'A safe test video',
          },
        },
      ),
    ).rejects.toThrow('Generated media URL is not allowed.');

    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it('rejects generated media with an oversized declared body', async () => {
    const AI = {
      run: vi.fn(async () => ({
        result: {
          video: 'https://media.example.test/video.mp4',
        },
      })),
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('x', {
          status: 200,
          headers: {
            'content-length': String(512 * 1024 * 1024 + 1),
          },
        }),
      ),
    );

    await expect(
      executeOrchestrationRequest(
        {
          AI,
          AI_ARTIFACTS: {} as R2Bucket,
        },
        {
          capability: 'video',
          tenantId: 'user-123',
          actorId: 'user-123',
          input: {
            prompt: 'A safe test video',
          },
        },
      ),
    ).rejects.toThrow('512 MiB artifact limit');
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
