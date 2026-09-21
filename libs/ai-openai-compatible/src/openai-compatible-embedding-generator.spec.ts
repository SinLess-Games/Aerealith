import type { ModelDescriptor } from '@aerealith-ai/ai-orchestration';

import { OpenAiCompatibleEmbeddingGenerator } from './openai-compatible-embedding-generator';
import { OpenAiCompatibleProvider } from './openai-compatible-provider';

const model: ModelDescriptor = {
  id: 'embedding-model',
  providerId: 'compatible',
  capabilities: ['embedding'],
};

describe('OpenAiCompatibleEmbeddingGenerator', () => {
  it('bridges the provider into the knowledge embedding contract', async () => {
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            data: [
              { index: 0, embedding: [0.1, 0.2] },
              { index: 1, embedding: [0.3, 0.4] },
            ],
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
    );

    const provider = new OpenAiCompatibleProvider({
      id: 'compatible',
      baseUrl: 'https://models.example.test/v1',
      models: [model],
      fetchImplementation,
    });

    const embeddings = new OpenAiCompatibleEmbeddingGenerator(
      provider,
      model,
      2,
    );

    await expect(embeddings.embed(['a', 'b'])).resolves.toEqual([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
  });

  it('rejects a runtime dimension mismatch', async () => {
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            data: [{ index: 0, embedding: [0.1, 0.2, 0.3] }],
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
    );

    const provider = new OpenAiCompatibleProvider({
      id: 'compatible',
      baseUrl: 'https://models.example.test/v1',
      models: [model],
      fetchImplementation,
    });

    const embeddings = new OpenAiCompatibleEmbeddingGenerator(
      provider,
      model,
      2,
    );

    await expect(embeddings.embed(['a'])).rejects.toThrow(
      'unexpected vector shape',
    );
  });
});
