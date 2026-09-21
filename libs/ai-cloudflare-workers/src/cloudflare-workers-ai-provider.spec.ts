import type {
  ModelDescriptor,
  OrchestrationRequest,
} from '@aerealith-ai/ai-orchestration';

import {
  CloudflareWorkersAiProvider,
  type WorkersAiBinding,
} from './cloudflare-workers-ai-provider';
import {
  CLOUDFLARE_WORKERS_AI_PROVIDER_ID,
  CloudflareWorkersAiModels,
  cloudflareWorkersAiModelCatalog,
} from './models';

function model(id: string): ModelDescriptor {
  const found = cloudflareWorkersAiModelCatalog.find(
    (candidate) => candidate.id === id,
  );
  if (!found) throw new Error(`missing test model: ${id}`);
  return found;
}

describe('CloudflareWorkersAiProvider', () => {
  it('executes text generation through the Workers AI binding', async () => {
    const run = vi.fn(async () => ({
      response: 'Hello from Cloudflare.',
      usage: {
        prompt_tokens: 100,
        completion_tokens: 20,
        total_tokens: 120,
      },
    }));
    const provider = new CloudflareWorkersAiProvider({ run });

    const result = await provider.execute(
      {
        capability: 'text',
        input: {
          messages: [{ role: 'user', content: 'Hello' }],
        },
      },
      model(CloudflareWorkersAiModels.general),
    );

    expect(result).toMatchObject({
      providerId: CLOUDFLARE_WORKERS_AI_PROVIDER_ID,
      modelId: CloudflareWorkersAiModels.general,
      content: { text: 'Hello from Cloudflare.' },
      usage: {
        inputUnits: 100,
        outputUnits: 20,
        totalUnits: 120,
      },
    });
    expect(run).toHaveBeenCalledWith(
      CloudflareWorkersAiModels.general,
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    );
  });

  it('uses the Qwen embedding model response shape', async () => {
    const run = vi.fn(async () => ({
      data: [
        [0.1, 0.2],
        [0.3, 0.4],
      ],
      shape: [2, 2],
    }));
    const provider = new CloudflareWorkersAiProvider({ run });

    const result = await provider.execute(
      {
        capability: 'embedding',
        input: { texts: ['one', 'two'] },
      },
      model(CloudflareWorkersAiModels.embedding),
    );

    expect(result.content).toEqual({
      vectors: [
        [0.1, 0.2],
        [0.3, 0.4],
      ],
      dimensions: 2,
    });
  });

  it('maps reranking indexes back to application document ids', async () => {
    const run = vi.fn(async () => ({
      response: [
        { id: 1, score: 0.92 },
        { id: 0, score: 0.71 },
      ],
    }));
    const provider = new CloudflareWorkersAiProvider({ run });

    const request: OrchestrationRequest = {
      capability: 'rerank',
      input: {
        query: 'best result',
        documents: [
          { id: 'doc-a', text: 'first' },
          { id: 'doc-b', text: 'second' },
        ],
      },
    };

    const result = await provider.execute(
      request,
      model(CloudflareWorkersAiModels.rerank),
    );

    expect(result.content).toEqual({
      results: [
        { id: 'doc-b', score: 0.92 },
        { id: 'doc-a', score: 0.71 },
      ],
    });
  });

  it('returns image bytes for the artifact runtime to persist', async () => {
    const base64 = btoa('fake-image');
    const run = vi.fn(async () => ({ image: base64 }));
    const provider = new CloudflareWorkersAiProvider({ run });

    const result = await provider.execute(
      {
        capability: 'image',
        input: { prompt: 'Aerealith logo' },
      },
      model(CloudflareWorkersAiModels.image),
    );

    const content = result.content as {
      kind: string;
      contentType: string;
      data: ArrayBuffer;
    };

    expect(content.kind).toBe('image');
    expect(content.contentType).toBe('image/jpeg');
    expect(new TextDecoder().decode(content.data)).toBe('fake-image');
  });

  it('normalizes Cloudflare unified video URLs', async () => {
    const run = vi.fn(async () => ({
      state: 'Completed',
      result: {
        video: 'https://media.example.test/video.mp4',
      },
    }));
    const provider = new CloudflareWorkersAiProvider({ run });

    const result = await provider.execute(
      {
        capability: 'video',
        input: {
          prompt: 'A storm rolling over a mountain',
          durationSeconds: 5,
          width: 1280,
          height: 720,
          fps: 24,
        },
      },
      model(CloudflareWorkersAiModels.video),
    );

    expect(result.content).toEqual({
      kind: 'video',
      contentType: 'video/mp4',
      url: 'https://media.example.test/video.mp4',
    });
    expect(run).toHaveBeenCalledWith(
      CloudflareWorkersAiModels.video,
      expect.objectContaining({
        prompt: 'A storm rolling over a mountain',
        duration: 5,
        resolution: '720p',
        aspect_ratio: '16:9',
        fps: 24,
      }),
    );
  });

  it('normalizes Cloudflare unified music URLs', async () => {
    const run = vi.fn(async () => ({
      state: 'Completed',
      result: {
        audio: 'https://media.example.test/song.mp3',
      },
    }));
    const provider = new CloudflareWorkersAiProvider({ run });

    const result = await provider.execute(
      {
        capability: 'music',
        input: {
          prompt: 'Dark cinematic synthwave',
          instrumental: true,
          format: 'mp3',
        },
      },
      model(CloudflareWorkersAiModels.music),
    );

    expect(result.content).toEqual({
      kind: 'music',
      contentType: 'audio/mpeg',
      url: 'https://media.example.test/song.mp3',
    });
    expect(run).toHaveBeenCalledWith(
      CloudflareWorkersAiModels.music,
      expect.objectContaining({
        prompt: 'Dark cinematic synthwave',
        is_instrumental: true,
        lyrics_optimizer: false,
        format: 'mp3',
      }),
    );
  });

  it('returns TTS streams for the artifact runtime to persist', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('audio'));
        controller.close();
      },
    });
    const run = vi.fn(async () => stream);
    const provider = new CloudflareWorkersAiProvider({ run } as WorkersAiBinding);

    const result = await provider.execute(
      {
        capability: 'audio',
        input: {
          text: 'Hello',
          format: 'mp3',
          voice: 'luna',
        },
      },
      model(CloudflareWorkersAiModels.audio),
    );

    expect(result.content).toMatchObject({
      kind: 'audio',
      contentType: 'audio/mpeg',
      data: stream,
    });
  });
});
