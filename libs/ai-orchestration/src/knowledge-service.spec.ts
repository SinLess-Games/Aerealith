import type {
  DocumentChunker,
  EmbeddingGenerator,
  KnowledgeDocument,
} from './knowledge';
import {
  KnowledgeIngestionService,
  KnowledgeRetrievalService,
} from './knowledge-service';
import type {
  RetrievalMatch,
  RetrievalQuery,
  VectorIndexConfiguration,
  VectorIndexManager,
  VectorStore,
} from './retrieval';

class TestChunker implements DocumentChunker {
  async chunk(document: KnowledgeDocument) {
    return [
      {
        id: `${document.id}:0`,
        documentId: document.id,
        text: document.text,
        metadata: document.metadata,
      },
    ];
  }
}

class TestEmbeddings implements EmbeddingGenerator {
  readonly modelId = 'test-embedding';
  readonly dimensions = 2;

  async embed(texts: readonly string[]) {
    return texts.map((text) => [text.length, 1] as const);
  }
}

class TestIndexManager implements VectorIndexManager {
  readonly ensureIndex = vi.fn(
    async (_namespace: string, _configuration: VectorIndexConfiguration) =>
      undefined,
  );
  readonly deleteIndex = vi.fn(async (_namespace: string) => undefined);
}

class TestVectorStore implements VectorStore {
  readonly upsert = vi.fn(async () => undefined);
  readonly search = vi.fn(
    async (_query: RetrievalQuery): Promise<readonly RetrievalMatch[]> => [
      { id: 'match-1', score: 0.99, text: 'matched' },
    ],
  );
  readonly delete = vi.fn(async () => undefined);
}

describe('KnowledgeIngestionService', () => {
  it('chunks, embeds, and writes documents to the vector store', async () => {
    const vectorStore = new TestVectorStore();
    const indexManager = new TestIndexManager();
    const service = new KnowledgeIngestionService(
      new TestChunker(),
      new TestEmbeddings(),
      vectorStore,
      indexManager,
    );

    const result = await service.ingest({
      namespace: 'tenant-a',
      documents: [
        {
          id: 'doc-1',
          text: 'hello',
          metadata: { source: 'manual' },
        },
      ],
    });

    expect(result).toEqual({
      namespace: 'tenant-a',
      documentsProcessed: 1,
      chunksWritten: 1,
      embeddingModelId: 'test-embedding',
    });
    expect(indexManager.ensureIndex).toHaveBeenCalledWith('tenant-a', {
      dimensions: 2,
      distance: 'cosine',
    });
    expect(vectorStore.upsert).toHaveBeenCalledWith('tenant-a', [
      {
        id: 'doc-1:0',
        vector: [5, 1],
        text: 'hello',
        metadata: {
          documentId: 'doc-1',
          source: 'manual',
        },
      },
    ]);
  });
});

describe('KnowledgeRetrievalService', () => {
  it('embeds a text query before searching the vector store', async () => {
    const vectorStore = new TestVectorStore();
    const service = new KnowledgeRetrievalService(
      new TestEmbeddings(),
      vectorStore,
    );

    const matches = await service.search({
      namespace: 'tenant-a',
      text: 'question',
      limit: 4,
    });

    expect(matches[0]?.id).toBe('match-1');
    expect(vectorStore.search).toHaveBeenCalledWith({
      namespace: 'tenant-a',
      vector: [8, 1],
      limit: 4,
    });
  });
});
