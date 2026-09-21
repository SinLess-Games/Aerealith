import type { EmbeddingGenerator } from './knowledge';
import type { EmbeddingOutput } from './task-outputs';
import type { ModelDescriptor, ModelProvider } from './providers';

export class ProviderEmbeddingGenerator implements EmbeddingGenerator {
  readonly modelId: string;
  readonly dimensions: number;

  constructor(
    private readonly provider: ModelProvider,
    private readonly model: ModelDescriptor,
    dimensions: number,
  ) {
    if (!model.capabilities.includes('embedding')) {
      throw new Error(
        `Model "${model.id}" does not declare the embedding capability.`,
      );
    }

    if (!Number.isInteger(dimensions) || dimensions <= 0) {
      throw new Error('Embedding dimensions must be a positive integer.');
    }

    this.modelId = model.id;
    this.dimensions = dimensions;
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
      content.dimensions !== this.dimensions ||
      content.vectors.length !== texts.length
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
