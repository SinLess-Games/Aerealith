import type {
  ModelDescriptor,
  OrchestrationRequest,
} from '@aerealith-ai/ai-orchestration';

import { OpenAiCompatibleProvider } from './openai-compatible-provider';

const models: readonly ModelDescriptor[] = [
  {
    id: 'chat-model',
    providerId: 'compatible',
    capabilities: ['text', 'code'],
    inputCostPerMillionUnitsUsd: 1,
    outputCostPerMillionUnitsUsd: 2,
  },
  {
    id: 'embedding-model',
    providerId: 'compatible',
    capabilities: ['embedding'],
    inputCostPerMillionUnitsUsd: 0.1,
  },
];

describe('OpenAiCompatibleProvider', () => {
  it('executes text generation and normalizes usage', async () => {
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            choices: [
              {
                finish_reason: 'stop',
                message: { content: 'Hello.' },
              },
            ],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 25,
              total_tokens: 125,
            },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
    );

    const provider = new OpenAiCompatibleProvider({
      id: 'compatible',
      baseUrl: 'https://models.example.test/v1/',
      apiKey: 'secret',
      models,
      fetchImplementation,
    });

    const result = await provider.execute(
      {
        capability: 'text',
        input: {
          messages: [{ role: 'user', content: 'Hello' }],
        },
      },
      models[0]!,
    );

    expect(result).toMatchObject({
      providerId: 'compatible',
      modelId: 'chat-model',
      content: {
        text: 'Hello.',
        finishReason: 'stop',
      },
      usage: {
        inputUnits: 100,
        outputUnits: 25,
        totalUnits: 125,
        estimatedCostUsd: 0.00015,
      },
    });

    const [url, init] = fetchImplementation.mock.calls[0] ?? [];
    expect(url).toBe('https://models.example.test/v1/chat/completions');
    expect(new Headers(init?.headers).get('authorization')).toBe(
      'Bearer secret',
    );
  });

  it('executes embedding requests and preserves input order', async () => {
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            data: [
              { index: 1, embedding: [0.3, 0.4] },
              { index: 0, embedding: [0.1, 0.2] },
            ],
            usage: {
              prompt_tokens: 20,
              total_tokens: 20,
            },
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
      models,
      fetchImplementation,
    });

    const request: OrchestrationRequest = {
      capability: 'embedding',
      input: { texts: ['first', 'second'] },
    };

    const result = await provider.execute(request, models[1]!);

    expect(result).toMatchObject({
      providerId: 'compatible',
      modelId: 'embedding-model',
      content: {
        vectors: [
          [0.1, 0.2],
          [0.3, 0.4],
        ],
        dimensions: 2,
      },
      usage: {
        inputUnits: 20,
        totalUnits: 20,
        estimatedCostUsd: 0.000002,
      },
    });

    const [url, init] = fetchImplementation.mock.calls[0] ?? [];
    expect(url).toBe('https://models.example.test/v1/embeddings');
    expect(JSON.parse(String(init?.body))).toEqual({
      model: 'embedding-model',
      input: ['first', 'second'],
    });
  });

  it('converts code tasks into chat-completion requests', async () => {
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: 'const value = 42;' } }],
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
      models,
      fetchImplementation,
    });

    await provider.execute(
      {
        capability: 'code',
        input: {
          mode: 'generate',
          instruction: 'Create a constant.',
          constraints: ['TypeScript'],
        },
      },
      models[0]!,
    );

    const [, init] = fetchImplementation.mock.calls[0] ?? [];
    const body = JSON.parse(String(init?.body)) as {
      messages: Array<{ role: string; content: string }>;
    };

    expect(body.messages[1]?.content).toContain('Create a constant.');
    expect(body.messages[1]?.content).toContain('TypeScript');
  });
});
