import type {
  EmbeddingGenerator,
  EmbeddingOutput,
  ModelDescriptor,
} from '@aerealith-ai/ai-orchestration';

import { OpenAiCompatibleProvider } from './openai-compatible-provider';

export class OpenAiCompatibleEmbeddingGenerator
  implements EmbeddingGenerator
{
  readonly modelId: string;
  readonly dimensions: number;

  constructor(
    private readonly provider: OpenAiCompatibleProvider,
    private readonly model: ModelDescriptor,
    dimensions: number,
  ) {
    this.modelId = model.id;
    this.dimensions = dimensions;

    if (!model.capabilities.includes('embedding')) {
      throw new Error(
        `Model "${model.id}" does not declare the embedding capability.`,
      );
    }

    if (!Number.isInteger(dimensions) || dimensions <= 0) {
      throw new Error('Embedding dimensions must be a positive integer.');
    }
  }

  async embed(
    texts: readonly string[],
  ): Promise<readonly (readonly number[])[]> {
    const result = await this.provider.execute(
      {
        capability: 'embedding',
        input: { texts },
      },
      this.model,
    );

    const content = result.content as EmbeddingOutput;

    if (
      !content ||
      !Array.isArray(content.vectors) ||
      content.dimensions !== this.dimensions
    ) {
      throw new Error(
        `Embedding model "${this.modelId}" returned an unexpected vector shape.`,
      );
    }

    if (content.vectors.some((vector) => vector.length !== this.dimensions)) {
      throw new Error(
        `Embedding model "${this.modelId}" returned inconsistent vector dimensions.`,
      );
    }

    return content.vectors;
  }
}
