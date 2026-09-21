import { QdrantVectorStore } from './qdrant-vector-store';

describe('QdrantVectorStore', () => {
  it('creates a missing collection with the embedding dimensions', async () => {
    const fetchImplementation = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: true, status: 'ok' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    const store = new QdrantVectorStore({
      baseUrl: 'https://qdrant.example.test',
      apiKey: 'secret',
      collectionPrefix: 'aerealith-',
      fetchImplementation,
    });

    await store.ensureIndex('knowledge', {
      dimensions: 1536,
      distance: 'cosine',
    });

    expect(fetchImplementation).toHaveBeenCalledTimes(2);
    expect(fetchImplementation.mock.calls[0]?.[0]).toBe(
      'https://qdrant.example.test/collections/aerealith-knowledge',
    );
    expect(fetchImplementation.mock.calls[0]?.[1]?.method).toBe('GET');

    const [, createInit] = fetchImplementation.mock.calls[1] ?? [];
    expect(createInit?.method).toBe('PUT');
    expect(JSON.parse(String(createInit?.body))).toEqual({
      vectors: {
        size: 1536,
        distance: 'Cosine',
      },
    });
    expect(new Headers(createInit?.headers).get('api-key')).toBe('secret');
  });

  it('does not recreate an existing collection', async () => {
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ result: { status: 'green' } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );

    const store = new QdrantVectorStore({
      baseUrl: 'https://qdrant.example.test',
      fetchImplementation,
    });

    await store.ensureIndex('knowledge', {
      dimensions: 768,
    });

    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    expect(fetchImplementation.mock.calls[0]?.[1]?.method).toBe('GET');
  });

  it('queries vectors and maps Qdrant payloads', async () => {
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            result: {
              points: [
                {
                  id: 'point-1',
                  score: 0.91,
                  payload: {
                    text: 'hello',
                    metadata: { source: 'test' },
                  },
                },
              ],
            },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
    );

    const store = new QdrantVectorStore({
      baseUrl: 'https://qdrant.example.test/',
      apiKey: 'secret',
      collectionPrefix: 'aerealith-',
      fetchImplementation,
    });

    const result = await store.search({
      namespace: 'knowledge',
      vector: [0.1, 0.2, 0.3],
      limit: 5,
    });

    expect(result).toEqual([
      {
        id: 'point-1',
        score: 0.91,
        text: 'hello',
        metadata: { source: 'test' },
      },
    ]);

    const [url, init] = fetchImplementation.mock.calls[0] ?? [];
    expect(url).toBe(
      'https://qdrant.example.test/collections/aerealith-knowledge/points/query',
    );
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('api-key')).toBe('secret');
  });

  it('upserts points using the Qdrant points endpoint', async () => {
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );

    const store = new QdrantVectorStore({
      baseUrl: 'https://qdrant.example.test',
      fetchImplementation,
    });

    await store.upsert('documents', [
      {
        id: 'doc-1',
        vector: [0.2, 0.4],
        text: 'document',
        metadata: { tenant: 'tenant-1' },
      },
    ]);

    const [url, init] = fetchImplementation.mock.calls[0] ?? [];
    expect(url).toBe(
      'https://qdrant.example.test/collections/documents/points?wait=true',
    );
    expect(init?.method).toBe('PUT');

    const body = JSON.parse(String(init?.body)) as {
      points: Array<{
        id: string;
        payload: {
          text: string;
          metadata: Record<string, unknown>;
        };
      }>;
    };

    expect(body.points[0]).toMatchObject({
      id: 'doc-1',
      payload: {
        text: 'document',
        metadata: { tenant: 'tenant-1' },
      },
    });
  });

  it('requires embeddings before vector search', async () => {
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(null, { status: 200 }),
    );

    const store = new QdrantVectorStore({
      baseUrl: 'https://qdrant.example.test',
      fetchImplementation,
    });

    await expect(
      store.search({
        namespace: 'knowledge',
        text: 'embed me first',
      }),
    ).rejects.toThrow('requires a non-empty query.vector');

    expect(fetchImplementation).not.toHaveBeenCalled();
  });
});
