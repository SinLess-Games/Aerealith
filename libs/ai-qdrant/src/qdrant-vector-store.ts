import type {
  RetrievalMatch,
  RetrievalQuery,
  VectorDistance,
  VectorIndexConfiguration,
  VectorIndexManager,
  VectorStore,
} from '@aerealith-ai/ai-orchestration';

const DEFAULT_LIMIT = 10;
const DEFAULT_COLLECTION = 'aerealith-knowledge';
const TEXT_FIELD = 'text';
const METADATA_FIELD = 'metadata';
const RECORD_ID_FIELD = 'record_id';
const NAMESPACE_FIELD = 'namespace';

export type QdrantVectorStoreOptions = {
  baseUrl: string;
  apiKey?: string;
  collectionName?: string;
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

type QdrantCollectionResponse = {
  result?: {
    config?: {
      params?: {
        vectors?: {
          size?: number;
          distance?: string;
        };
      };
    };
    payload_schema?: Record<string, unknown>;
  };
};

export class QdrantVectorStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QdrantVectorStoreError';
  }
}

/**
 * Qdrant-backed vector storage using one shared collection and payload-based
 * namespace partitioning. This avoids creating a collection for every tenant
 * or knowledge base while still enforcing namespace filters on every query.
 */
export class QdrantVectorStore implements VectorStore, VectorIndexManager {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly collectionName: string;
  private readonly fetchImplementation: typeof globalThis.fetch;

  constructor(options: QdrantVectorStoreOptions) {
    this.baseUrl = trimTrailingSlashes(options.baseUrl.trim());
    this.apiKey = options.apiKey?.trim() || undefined;
    this.collectionName =
      options.collectionName?.trim() || DEFAULT_COLLECTION;
    this.fetchImplementation =
      options.fetchImplementation ?? globalThis.fetch.bind(globalThis);

    if (!this.baseUrl) {
      throw new QdrantVectorStoreError('A Qdrant base URL is required.');
    }

    if (!this.collectionName) {
      throw new QdrantVectorStoreError('A Qdrant collection name is required.');
    }
  }

  async ensureIndex(
    namespace: string,
    configuration: VectorIndexConfiguration,
  ): Promise<void> {
    normalizeNamespace(namespace);

    if (
      !Number.isInteger(configuration.dimensions) ||
      configuration.dimensions <= 0
    ) {
      throw new QdrantVectorStoreError(
        'Qdrant vector dimensions must be a positive integer.',
      );
    }

    const collectionUrl = this.collectionPath();
    const desiredDistance = toQdrantDistance(
      configuration.distance ?? 'cosine',
    );
    const existing = await this.fetch(collectionUrl, { method: 'GET' });

    if (existing.ok) {
      const details = (await existing.json()) as QdrantCollectionResponse;
      this.assertCompatibleCollection(
        details,
        configuration.dimensions,
        desiredDistance,
      );

      if (!details.result?.payload_schema?.[NAMESPACE_FIELD]) {
        await this.ensureTenantPayloadIndex();
      }

      return;
    }

    if (existing.status !== 404) {
      throw new QdrantVectorStoreError(
        `Qdrant collection lookup failed with HTTP ${existing.status}.`,
      );
    }

    await this.request(collectionUrl, {
      method: 'PUT',
      body: JSON.stringify({
        vectors: {
          size: configuration.dimensions,
          distance: desiredDistance,
        },
      }),
    });

    await this.ensureTenantPayloadIndex();
  }

  /**
   * Deletes every point in the logical namespace while preserving the shared
   * collection and the data belonging to other namespaces.
   */
  async deleteIndex(namespace: string): Promise<void> {
    const normalizedNamespace = normalizeNamespace(namespace);

    await this.request(this.collectionPath('/points/delete?wait=true'), {
      method: 'POST',
      body: JSON.stringify({
        filter: namespaceFilter(normalizedNamespace),
      }),
    });
  }

  async search(query: RetrievalQuery): Promise<readonly RetrievalMatch[]> {
    const namespace = normalizeNamespace(query.namespace);

    if (!query.vector || query.vector.length === 0) {
      throw new QdrantVectorStoreError(
        'Qdrant vector search requires a non-empty query.vector. Generate embeddings before calling the vector store.',
      );
    }

    const response = await this.request<QdrantQueryResponse>(
      this.collectionPath('/points/query'),
      {
        method: 'POST',
        body: JSON.stringify({
          query: [...query.vector],
          limit: query.limit ?? DEFAULT_LIMIT,
          with_payload: true,
          with_vector: false,
          filter: mergeNamespaceFilter(namespace, query.filter),
        }),
      },
    );

    return (response.result?.points ?? []).map((point) => {
      const payload = point.payload ?? {};
      const text =
        typeof payload[TEXT_FIELD] === 'string'
          ? (payload[TEXT_FIELD] as string)
          : undefined;
      const recordId =
        typeof payload[RECORD_ID_FIELD] === 'string'
          ? (payload[RECORD_ID_FIELD] as string)
          : String(point.id);
      const metadataValue = payload[METADATA_FIELD];
      const metadata = isRecord(metadataValue) ? metadataValue : undefined;

      return {
        id: recordId,
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

    const normalizedNamespace = normalizeNamespace(namespace);
    const points = await Promise.all(
      records.map(async (record) => ({
        id: await deterministicPointId(normalizedNamespace, record.id),
        vector: [...record.vector],
        payload: {
          [NAMESPACE_FIELD]: normalizedNamespace,
          [RECORD_ID_FIELD]: record.id,
          ...(record.text ? { [TEXT_FIELD]: record.text } : {}),
          ...(record.metadata
            ? { [METADATA_FIELD]: record.metadata }
            : {}),
        },
      })),
    );

    await this.request(this.collectionPath('/points?wait=true'), {
      method: 'PUT',
      body: JSON.stringify({ points }),
    });
  }

  async delete(namespace: string, ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;

    const normalizedNamespace = normalizeNamespace(namespace);
    const pointIds = await Promise.all(
      ids.map((id) => deterministicPointId(normalizedNamespace, id)),
    );

    await this.request(this.collectionPath('/points/delete?wait=true'), {
      method: 'POST',
      body: JSON.stringify({ points: pointIds }),
    });
  }

  private assertCompatibleCollection(
    details: QdrantCollectionResponse,
    dimensions: number,
    distance: 'Cosine' | 'Dot' | 'Euclid' | 'Manhattan',
  ): void {
    const vectors = details.result?.config?.params?.vectors;
    const existingDimensions = vectors?.size;
    const existingDistance = vectors?.distance;

    if (existingDimensions !== dimensions) {
      throw new QdrantVectorStoreError(
        `Qdrant collection "${this.collectionName}" uses ${existingDimensions ?? 'unknown'} dimensions; the active embedding model requires ${dimensions}.`,
      );
    }

    if (
      existingDistance &&
      existingDistance.toLowerCase() !== distance.toLowerCase()
    ) {
      throw new QdrantVectorStoreError(
        `Qdrant collection "${this.collectionName}" uses ${existingDistance} distance; ${distance} is required.`,
      );
    }
  }

  private async ensureTenantPayloadIndex(): Promise<void> {
    await this.request(this.collectionPath('/index?wait=true'), {
      method: 'PUT',
      body: JSON.stringify({
        field_name: NAMESPACE_FIELD,
        field_schema: {
          type: 'keyword',
          is_tenant: true,
        },
      }),
    });
  }

  private collectionPath(suffix = ''): string {
    return `${this.baseUrl}/collections/${encodeURIComponent(
      this.collectionName,
    )}${suffix}`;
  }

  private async request<T = unknown>(
    url: string,
    init: RequestInit,
  ): Promise<T> {
    const response = await this.fetch(url, init);

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

  private fetch(url: string, init: RequestInit): Promise<Response> {
    const headers = new Headers(init.headers);

    if (init.body !== undefined) {
      headers.set('content-type', 'application/json');
    }

    if (this.apiKey) {
      headers.set('api-key', this.apiKey);
    }

    return this.fetchImplementation(url, {
      ...init,
      headers,
    });
  }
}

function namespaceFilter(namespace: string) {
  return {
    must: [
      {
        key: NAMESPACE_FIELD,
        match: { value: namespace },
      },
    ],
  };
}

function mergeNamespaceFilter(
  namespace: string,
  filter: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const existingMust =
    filter && Array.isArray(filter['must']) ? filter['must'] : [];

  return {
    ...(filter ?? {}),
    must: [
      {
        key: NAMESPACE_FIELD,
        match: { value: namespace },
      },
      ...existingMust,
    ],
  };
}

function normalizeNamespace(namespace: string): string {
  const normalized = namespace.trim();

  if (!normalized) {
    throw new QdrantVectorStoreError('A Qdrant namespace is required.');
  }

  if (normalized.length > 256) {
    throw new QdrantVectorStoreError(
      'A Qdrant namespace may contain at most 256 characters.',
    );
  }

  return normalized;
}

async function deterministicPointId(
  namespace: string,
  recordId: string,
): Promise<string> {
  const input = new TextEncoder().encode(`${namespace}\u0000${recordId}`);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', input));
  const bytes = digest.slice(0, 16);

  // RFC 4122-compatible deterministic UUID shape.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = [...bytes]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

function toQdrantDistance(
  distance: VectorDistance,
): 'Cosine' | 'Dot' | 'Euclid' | 'Manhattan' {
  switch (distance) {
    case 'cosine':
      return 'Cosine';
    case 'dot':
      return 'Dot';
    case 'euclid':
      return 'Euclid';
    case 'manhattan':
      return 'Manhattan';
  }
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
