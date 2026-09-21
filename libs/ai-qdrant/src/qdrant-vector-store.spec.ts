import { QdrantVectorStore } from './qdrant-vector-store';

describe('QdrantVectorStore', () => {
  it('creates the shared collection and tenant payload index', async () => {
    const fetchImplementation = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: true, status: 'ok' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: true, status: 'ok' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    const store = new QdrantVectorStore({
      baseUrl: 'https://qdrant.example.test',
      apiKey: 'secret',
      collectionName: 'aerealith-knowledge',
      fetchImplementation,
    });

    await store.ensureIndex('tenant-a', {
      dimensions: 1536,
      distance: 'cosine',
    });

    expect(fetchImplementation).toHaveBeenCalledTimes(3);
    expect(fetchImplementation.mock.calls[0]?.[0]).toBe(
      'https://qdrant.example.test/collections/aerealith-knowledge',
    );
    expect(fetchImplementation.mock.calls[0]?.[1]?.method).toBe('GET');

    const [, createCollectionInit] = fetchImplementation.mock.calls[1] ?? [];
    expect(createCollectionInit?.method).toBe('PUT');
    expect(JSON.parse(String(createCollectionInit?.body))).toEqual({
      vectors: {
        size: 1536,
        distance: 'Cosine',
      },
    });

    const [indexUrl, createIndexInit] = fetchImplementation.mock.calls[2] ?? [];
    expect(indexUrl).toBe(
      'https://qdrant.example.test/collections/aerealith-knowledge/index?wait=true',
    );
    expect(createIndexInit?.method).toBe('PUT');
    expect(JSON.parse(String(createIndexInit?.body))).toEqual({
      field_name: 'namespace',
      field_schema: {
        type: 'keyword',
        is_tenant: true,
      },
    });
    expect(new Headers(createIndexInit?.headers).get('api-key')).toBe('secret');
  });

  it('does not recreate an existing shared collection', async () => {
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            result: {
              status: 'green',
              config: {
                params: {
                  vectors: {
                    size: 768,
                    distance: 'Cosine',
                  },
                },
              },
              payload_schema: {
                namespace: {
                  data_type: 'keyword',
                },
              },
            },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
    );

    const store = new QdrantVectorStore({
      baseUrl: 'https://qdrant.example.test',
      fetchImplementation,
    });

    await store.ensureIndex('tenant-a', {
      dimensions: 768,
    });

    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    expect(fetchImplementation.mock.calls[0]?.[1]?.method).toBe('GET');
  });

  it('rejects an incompatible existing collection before writing vectors', async () => {
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            result: {
              config: {
                params: {
                  vectors: {
                    size: 768,
                    distance: 'Cosine',
                  },
                },
              },
              payload_schema: {
                namespace: {
                  data_type: 'keyword',
                },
              },
            },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
    );

    const store = new QdrantVectorStore({
      baseUrl: 'https://qdrant.example.test',
      fetchImplementation,
    });

    await expect(
      store.ensureIndex('tenant-a', {
        dimensions: 1536,
        distance: 'cosine',
      }),
    ).rejects.toThrow('uses 768 dimensions');

    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it('repairs a missing tenant payload index on an existing collection', async () => {
    const fetchImplementation = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: {
              config: {
                params: {
                  vectors: {
                    size: 768,
                    distance: 'Cosine',
                  },
                },
              },
              payload_schema: {},
            },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    const store = new QdrantVectorStore({
      baseUrl: 'https://qdrant.example.test',
      fetchImplementation,
    });

    await store.ensureIndex('tenant-a', {
      dimensions: 768,
    });

    expect(fetchImplementation).toHaveBeenCalledTimes(2);
    expect(fetchImplementation.mock.calls[1]?.[0]).toBe(
      'https://qdrant.example.test/collections/aerealith-knowledge/index?wait=true',
    );
  });

  it('enforces namespace filtering for vector queries', async () => {
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            result: {
              points: [
                {
                  id: '550e8400-e29b-41d4-a716-446655440000',
                  score: 0.91,
                  payload: {
                    namespace: 'tenant-a',
                    record_id: 'point-1',
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
      collectionName: 'aerealith-knowledge',
      fetchImplementation,
    });

    const result = await store.search({
      namespace: 'tenant-a',
      vector: [0.1, 0.2, 0.3],
      limit: 5,
      filter: {
        must: [{ key: 'metadata.source', match: { value: 'test' } }],
      },
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

    const body = JSON.parse(String(init?.body)) as {
      filter: {
        must: Array<Record<string, unknown>>;
      };
    };

    expect(body.filter.must[0]).toEqual({
      key: 'namespace',
      match: { value: 'tenant-a' },
    });
    expect(body.filter.must[1]).toEqual({
      key: 'metadata.source',
      match: { value: 'test' },
    });
  });

  it('upserts points with deterministic UUIDs and tenant payloads', async () => {
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

    await store.upsert('tenant-a', [
      {
        id: 'doc-1:0',
        vector: [0.2, 0.4],
        text: 'document',
        metadata: { source: 'manual' },
      },
    ]);

    const [url, init] = fetchImplementation.mock.calls[0] ?? [];
    expect(url).toBe(
      'https://qdrant.example.test/collections/aerealith-knowledge/points?wait=true',
    );
    expect(init?.method).toBe('PUT');

    const body = JSON.parse(String(init?.body)) as {
      points: Array<{
        id: string;
        payload: {
          namespace: string;
          record_id: string;
          text: string;
          metadata: Record<string, unknown>;
        };
      }>;
    };

    expect(body.points[0]?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(body.points[0]?.payload).toEqual({
      namespace: 'tenant-a',
      record_id: 'doc-1:0',
      text: 'document',
      metadata: { source: 'manual' },
    });
  });

  it('deletes only the requested namespace when deleting an index', async () => {
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

    await store.deleteIndex('tenant-a');

    const [url, init] = fetchImplementation.mock.calls[0] ?? [];
    expect(url).toBe(
      'https://qdrant.example.test/collections/aerealith-knowledge/points/delete?wait=true',
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      filter: {
        must: [
          {
            key: 'namespace',
            match: { value: 'tenant-a' },
          },
        ],
      },
    });
  });

  it('deletes filtered points without crossing namespace boundaries', async () => {
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

    await store.deleteByFilter('tenant-a', {
      must: [
        {
          key: 'metadata.documentId',
          match: { value: 'doc-1' },
        },
      ],
    });

    const [url, init] = fetchImplementation.mock.calls[0] ?? [];
    expect(url).toBe(
      'https://qdrant.example.test/collections/aerealith-knowledge/points/delete?wait=true',
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      filter: {
        must: [
          {
            key: 'namespace',
            match: { value: 'tenant-a' },
          },
          {
            key: 'metadata.documentId',
            match: { value: 'doc-1' },
          },
        ],
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
