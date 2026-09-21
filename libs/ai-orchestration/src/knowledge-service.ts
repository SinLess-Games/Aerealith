import type {
  DocumentChunker,
  EmbeddingGenerator,
  KnowledgeIngestionRequest,
  KnowledgeIngestionResult,
} from './knowledge';
import type {
  RetrievalMatch,
  RetrievalQuery,
  VectorIndexManager,
  VectorStore,
} from './retrieval';

export class KnowledgeIngestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KnowledgeIngestionError';
  }
}

export class KnowledgeIngestionService {
  constructor(
    private readonly chunker: DocumentChunker,
    private readonly embeddings: EmbeddingGenerator,
    private readonly vectorStore: VectorStore,
    private readonly indexManager?: VectorIndexManager,
  ) {}

  async ingest(
    request: KnowledgeIngestionRequest,
  ): Promise<KnowledgeIngestionResult> {
    const chunks = (
      await Promise.all(
        request.documents.map((document) => this.chunker.chunk(document)),
      )
    ).flat();

    if (chunks.length === 0) {
      return {
        namespace: request.namespace,
        documentsProcessed: request.documents.length,
        chunksWritten: 0,
        embeddingModelId: this.embeddings.modelId,
      };
    }

    const vectors = await this.embeddings.embed(
      chunks.map((chunk) => chunk.text),
    );

    if (vectors.length !== chunks.length) {
      throw new KnowledgeIngestionError(
        `Embedding generator returned ${vectors.length} vectors for ${chunks.length} chunks.`,
      );
    }

    const records = chunks.map((chunk, index) => {
      const vector = vectors[index];
      if (!vector || vector.length === 0) {
        throw new KnowledgeIngestionError(
          `Embedding generator returned an empty vector for chunk "${chunk.id}".`,
        );
      }

      if (vector.length !== this.embeddings.dimensions) {
        throw new KnowledgeIngestionError(
          `Embedding vector for chunk "${chunk.id}" has ${vector.length} dimensions; expected ${this.embeddings.dimensions}.`,
        );
      }

      return {
        id: chunk.id,
        vector,
        text: chunk.text,
        metadata: {
          ...(chunk.metadata ?? {}),
          documentId: chunk.documentId,
        },
      };
    });

    await this.indexManager?.ensureIndex(request.namespace, {
      dimensions: this.embeddings.dimensions,
      distance: 'cosine',
    });

    await this.vectorStore.upsert(request.namespace, records);

    return {
      namespace: request.namespace,
      documentsProcessed: request.documents.length,
      chunksWritten: chunks.length,
      embeddingModelId: this.embeddings.modelId,
    };
  }
}

export type KnowledgeSearchRequest = Omit<RetrievalQuery, 'vector' | 'text'> & {
  text: string;
};

export class KnowledgeRetrievalService {
  constructor(
    private readonly embeddings: EmbeddingGenerator,
    private readonly vectorStore: VectorStore,
  ) {}

  async search(
    request: KnowledgeSearchRequest,
  ): Promise<readonly RetrievalMatch[]> {
    const [vector] = await this.embeddings.embed([request.text]);

    if (!vector || vector.length === 0) {
      throw new KnowledgeIngestionError(
        'Embedding generator returned no vector for the retrieval query.',
      );
    }

    if (vector.length !== this.embeddings.dimensions) {
      throw new KnowledgeIngestionError(
        `Embedding query vector has ${vector.length} dimensions; expected ${this.embeddings.dimensions}.`,
      );
    }

    return this.vectorStore.search({
      namespace: request.namespace,
      vector,
      ...(request.limit === undefined ? {} : { limit: request.limit }),
      ...(request.filter === undefined ? {} : { filter: request.filter }),
    });
  }
}
