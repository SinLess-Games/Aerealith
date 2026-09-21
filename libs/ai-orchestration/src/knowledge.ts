export type KnowledgeDocument = {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
};

export type KnowledgeChunk = {
  id: string;
  documentId: string;
  text: string;
  metadata?: Record<string, unknown>;
};

export interface DocumentChunker {
  chunk(document: KnowledgeDocument): Promise<readonly KnowledgeChunk[]>;
}

export interface EmbeddingGenerator {
  readonly modelId: string;
  readonly dimensions: number;
  embed(texts: readonly string[]): Promise<readonly (readonly number[])[]>;
}

export type KnowledgeIngestionRequest = {
  namespace: string;
  documents: readonly KnowledgeDocument[];
};

export type KnowledgeIngestionResult = {
  namespace: string;
  documentsProcessed: number;
  chunksWritten: number;
  embeddingModelId: string;
};
