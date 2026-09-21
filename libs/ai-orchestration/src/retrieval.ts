export type RetrievalQuery = {
  namespace: string;
  text?: string;
  vector?: readonly number[];
  limit?: number;
  filter?: Record<string, unknown>;
};

export type RetrievalMatch = {
  id: string;
  score: number;
  text?: string;
  metadata?: Record<string, unknown>;
};

export type VectorDistance = 'cosine' | 'dot' | 'euclid' | 'manhattan';

export type VectorIndexConfiguration = {
  dimensions: number;
  distance?: VectorDistance;
};

export interface VectorIndexManager {
  ensureIndex(
    namespace: string,
    configuration: VectorIndexConfiguration,
  ): Promise<void>;
  deleteIndex(namespace: string): Promise<void>;
}

export interface VectorStore {
  search(query: RetrievalQuery): Promise<readonly RetrievalMatch[]>;
  upsert(
    namespace: string,
    records: readonly {
      id: string;
      vector: readonly number[];
      text?: string;
      metadata?: Record<string, unknown>;
    }[],
  ): Promise<void>;
  delete(namespace: string, ids: readonly string[]): Promise<void>;
}
