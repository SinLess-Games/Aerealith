export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export type TextMessage = {
  role: ChatRole;
  content: string;
  name?: string;
};

export type TextGenerationInput = {
  messages: readonly TextMessage[];
  maxOutputTokens?: number;
  temperature?: number;
  stop?: readonly string[];
  responseFormat?: 'text' | 'json';
};

export type CodeTaskMode = 'generate' | 'edit' | 'debug' | 'review' | 'test';

export type CodeGenerationInput = {
  mode: CodeTaskMode;
  instruction: string;
  repository?: {
    url?: string;
    ref?: string;
    workspaceId?: string;
  };
  paths?: readonly string[];
  constraints?: readonly string[];
};

export type ImageGenerationInput = {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  count?: number;
  seed?: number;
  referenceArtifactIds?: readonly string[];
};

export type AudioGenerationInput = {
  text?: string;
  prompt?: string;
  voice?: string;
  language?: string;
  format?: 'mp3' | 'wav' | 'flac' | 'ogg';
  durationSeconds?: number;
};

export type VideoGenerationInput = {
  prompt: string;
  negativePrompt?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  fps?: number;
  seed?: number;
  referenceArtifactIds?: readonly string[];
};

export type MusicGenerationInput = {
  prompt: string;
  lyrics?: string;
  instrumental?: boolean;
  durationSeconds?: number;
  format?: 'mp3' | 'wav' | 'flac';
  seed?: number;
};

export type AnalyticsInput = {
  question: string;
  datasetArtifactIds?: readonly string[];
  data?: unknown;
  requestedOutputs?: readonly (
    | 'summary'
    | 'table'
    | 'chart'
    | 'statistics'
    | 'code'
  )[];
};

export type PredictionInput = {
  objective: string;
  data?: unknown;
  datasetArtifactIds?: readonly string[];
  target?: string;
  horizon?: number;
  confidenceIntervals?: boolean;
};

export type EmbeddingInput = {
  texts: readonly string[];
};

export type RerankInput = {
  query: string;
  documents: readonly {
    id: string;
    text: string;
  }[];
  limit?: number;
};

export type RetrievalInput = {
  namespace: string;
  query: string;
  limit?: number;
  filter?: Record<string, unknown>;
};

export type ToolInvocationInput = {
  name: string;
  arguments: unknown;
};

export type CapabilityInputMap = {
  text: TextGenerationInput;
  code: CodeGenerationInput;
  embedding: EmbeddingInput;
  rerank: RerankInput;
  image: ImageGenerationInput;
  audio: AudioGenerationInput;
  video: VideoGenerationInput;
  music: MusicGenerationInput;
  analytics: AnalyticsInput;
  prediction: PredictionInput;
  retrieval: RetrievalInput;
  tool: ToolInvocationInput;
};
