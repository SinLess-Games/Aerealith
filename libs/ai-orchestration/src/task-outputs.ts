import type { ArtifactReference } from './artifacts';

export type TextGenerationOutput = {
  text: string;
  finishReason?: string;
};

export type CodeGenerationOutput = {
  summary: string;
  changedFiles?: readonly string[];
  patchArtifact?: ArtifactReference;
  testResults?: {
    passed: boolean;
    command?: string;
    stdout?: string;
    stderr?: string;
  };
};

export type EmbeddingOutput = {
  vectors: readonly (readonly number[])[];
  dimensions: number;
};

export type RerankOutput = {
  results: readonly {
    id: string;
    score: number;
  }[];
};

export type MediaGenerationOutput = {
  artifacts: readonly ArtifactReference[];
};

export type AnalyticsOutput = {
  summary: string;
  artifacts?: readonly ArtifactReference[];
  data?: unknown;
};

export type PredictionOutput = {
  summary: string;
  predictions: unknown;
  confidence?: unknown;
  artifacts?: readonly ArtifactReference[];
};

export type KnowledgeIngestionOutput = {
  namespace: string;
  documentsProcessed: number;
  chunksWritten: number;
  embeddingModelId: string;
};

export type RetrievalOutput = {
  matches: readonly {
    id: string;
    score: number;
    text?: string;
    metadata?: Record<string, unknown>;
  }[];
};

export type ToolInvocationOutput = {
  output: unknown;
};

export type CapabilityOutputMap = {
  text: TextGenerationOutput;
  code: CodeGenerationOutput;
  embedding: EmbeddingOutput;
  rerank: RerankOutput;
  image: MediaGenerationOutput;
  audio: MediaGenerationOutput;
  video: MediaGenerationOutput;
  music: MediaGenerationOutput;
  analytics: AnalyticsOutput;
  prediction: PredictionOutput;
  'knowledge-ingest': KnowledgeIngestionOutput;
  retrieval: RetrievalOutput;
  tool: ToolInvocationOutput;
};
