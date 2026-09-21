import type {
  RetrievalMatch,
  RetrievalQuery,
  VectorStore,
} from '@aerealith-ai/ai-orchestration';

const DEFAULT_LIMIT = 10;
const TEXT_FIELD = 'text';
const METADATA_FIELD = 'metadata';

export type QdrantVectorStoreOptions = {
  baseUrl: string;
  apiKey?: string;
  collectionPrefix?: string;
  fetchImplementation?: typeof globalThis.fetch;
};

type QdrantPoint = {
  id: string | number;
  score?: number;
  payload?: Record<string, unknown>;
};

type QdrantQueryResponse = {
  result?: {
    points?: QdrantPoint[];
  };
};

export class QdrantVectorStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QdrantVectorStoreError';
  }
}

export class QdrantVectorStore implements VectorStore {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly collectionPrefix: string;
  private readonly fetchImplementation: typeof globalThis.fetch;

  constructor(options: QdrantVectorStoreOptions) {
    this.baseUrl = trimTrailingSlashes(options.baseUrl.trim());
    this.apiKey = options.apiKey?.trim() || undefined;
    this.collectionPrefix = options.collectionPrefix?.trim() || '';
    this.fetchImplementation =
      options.fetchImplementation ?? globalThis.fetch.bind(globalThis);

    if (!this.baseUrl) {
      throw new QdrantVectorStoreError('A Qdrant base URL is required.');
    }
  }

  async search(query: RetrievalQuery): Promise<readonly RetrievalMatch[]> {
    if (!query.vector || query.vector.length === 0) {
      throw new QdrantVectorStoreError(
        'Qdrant vector search requires a non-empty query.vector. Generate embeddings before calling the vector store.',
      );
    }

    const response = await this.request<QdrantQueryResponse>(
      this.collectionPath(query.namespace, '/points/query'),
      {
        method: 'POST',
        body: JSON.stringify({
          query: [...query.vector],
          limit: query.limit ?? DEFAULT_LIMIT,
          with_payload: true,
          with_vector: false,
          ...(query.filter ? { filter: query.filter } : {}),
        }),
      },
    );

    return (response.result?.points ?? []).map((point) => {
      const payload = point.payload ?? {};
      const text =
        typeof payload[TEXT_FIELD] === 'string'
          ? (payload[TEXT_FIELD] as string)
          : undefined;
      const metadataValue = payload[METADATA_FIELD];
      const metadata =
        isRecord(metadataValue) ? metadataValue : undefined;

      return {
        id: String(point.id),
        score: point.score ?? 0,
        ...(text ? { text } : {}),
        ...(metadata ? { metadata } : {}),
      };
    });
  }

  async upsert(
    namespace: string,
    records: readonly {
      id: string;
      vector: readonly number[];
      text?: string;
      metadata?: Record<string, unknown>;
    }[],
  ): Promise<void> {
    if (records.length === 0) return;

    await this.request(
      this.collectionPath(namespace, '/points?wait=true'),
      {
        method: 'PUT',
        body: JSON.stringify({
          points: records.map((record) => ({
            id: record.id,
            vector: [...record.vector],
            payload: {
              ...(record.text ? { [TEXT_FIELD]: record.text } : {}),
              ...(record.metadata
                ? { [METADATA_FIELD]: record.metadata }
                : {}),
            },
          })),
        }),
      },
    );
  }

  async delete(namespace: string, ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;

    await this.request(
      this.collectionPath(namespace, '/points/delete?wait=true'),
      {
        method: 'POST',
        body: JSON.stringify({ points: [...ids] }),
      },
    );
  }

  private collectionPath(namespace: string, suffix: string): string {
    const normalized = namespace.trim();
    if (!normalized) {
      throw new QdrantVectorStoreError('A Qdrant namespace is required.');
    }

    const collection = `${this.collectionPrefix}${normalized}`;
    return `${this.baseUrl}/collections/${encodeURIComponent(collection)}${suffix}`;
  }

  private async request<T = unknown>(
    url: string,
    init: RequestInit,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('content-type', 'application/json');

    if (this.apiKey) {
      headers.set('api-key', this.apiKey);
    }

    const response = await this.fetchImplementation(url, {
      ...init,
      headers,
    });

    if (!response.ok) {
      throw new QdrantVectorStoreError(
        `Qdrant request failed with HTTP ${response.status}.`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
