import type {
  ModelDescriptor,
  ModelProvider,
  OrchestrationOutput,
  OrchestrationRequest,
} from './index';
import { ProviderEmbeddingGenerator } from './provider-embedding-generator';

const model: ModelDescriptor = {
  id: 'embedding-model',
  providerId: 'provider-a',
  capabilities: ['embedding'],
};

class TestProvider implements ModelProvider {
  readonly id = 'provider-a';

  listModels(): readonly ModelDescriptor[] {
    return [model];
  }

  async execute(
    request: OrchestrationRequest,
    selectedModel: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    const texts = (request.input as { texts: string[] }).texts;

    return {
      providerId: this.id,
      modelId: selectedModel.id,
      content: {
        vectors: texts.map((text) => [text.length, 1]),
        dimensions: 2,
      },
    };
  }
}

describe('ProviderEmbeddingGenerator', () => {
  it('uses a provider embedding model behind the generic knowledge contract', async () => {
    const generator = new ProviderEmbeddingGenerator(
      new TestProvider(),
      model,
      2,
    );

    await expect(generator.embed(['hello', 'world!'])).resolves.toEqual([
      [5, 1],
      [6, 1],
    ]);
  });

  it('rejects a model without embedding capability', () => {
    expect(
      () =>
        new ProviderEmbeddingGenerator(
          new TestProvider(),
          {
            ...model,
            capabilities: ['text'],
          },
          2,
        ),
    ).toThrow('does not declare the embedding capability');
  });
});
