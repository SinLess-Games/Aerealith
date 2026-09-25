import type { RunRecord } from '@aerealith-ai/ai-orchestration';

import {
  consumeAiTextStream,
  isTerminalRun,
  modelsForCapability,
  runArtifactIds,
  runOutputText,
} from './ai-client';

function run(
  status: RunRecord['status'],
  output?: RunRecord['output'],
): RunRecord {
  return {
    id: 'run-1',
    status,
    capability: 'text',
    createdAt: '2026-09-21T00:00:00.000Z',
    updatedAt: '2026-09-21T00:00:00.000Z',
    ...(output ? { output } : {}),
  };
}

describe('AI frontend helpers', () => {
  it('recognizes terminal durable run states', () => {
    expect(isTerminalRun(run('accepted'))).toBe(false);
    expect(isTerminalRun(run('running'))).toBe(false);
    expect(isTerminalRun(run('succeeded'))).toBe(true);
    expect(isTerminalRun(run('failed'))).toBe(true);
    expect(isTerminalRun(run('cancelled'))).toBe(true);
  });

  it('filters models by capability', () => {
    expect(
      modelsForCapability(
        [
          {
            id: 'text-model',
            providerId: 'cloudflare',
            capabilities: ['text'],
          },
          {
            id: 'image-model',
            providerId: 'cloudflare',
            capabilities: ['image'],
          },
        ],
        'text',
      ),
    ).toEqual([
      expect.objectContaining({
        id: 'text-model',
      }),
    ]);
  });

  it('consumes Cloudflare/OpenAI-compatible SSE deltas', async () => {
    const encoder = new TextEncoder();
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n',
      '\ndata: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
      'data: [DONE]\n\n',
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });
    const deltas: string[] = [];

    await expect(
      consumeAiTextStream(stream, (delta) => deltas.push(delta)),
    ).resolves.toBe('Hello');
    expect(deltas).toEqual(['Hel', 'lo']);
  });

  it('extracts text and artifacts from normalized run output', () => {
    const value = run('succeeded', {
      content: { text: 'done' },
      providerId: 'cloudflare-workers-ai',
      modelId: 'model',
      artifacts: ['artifact-1'],
    });

    expect(runOutputText(value)).toBe('done');
    expect(runArtifactIds(value)).toEqual(['artifact-1']);
  });
});
