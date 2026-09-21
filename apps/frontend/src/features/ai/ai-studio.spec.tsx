// @vitest-environment jsdom
import { FeatureFlag } from '@aerealith-ai/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StaticFeatureFlagsProvider } from '../flags/feature-flags';
import { AiStudio } from './ai-studio';

afterEach(() => vi.unstubAllGlobals());

function renderStudio() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StaticFeatureFlagsProvider
        values={{
          [FeatureFlag.AiStudio]: true,
          [FeatureFlag.AiChat]: true,
          [FeatureFlag.AiStreaming]: true,
          [FeatureFlag.AiModelSelector]: true,
          [FeatureFlag.AiCode]: true,
          [FeatureFlag.AiImage]: true,
          [FeatureFlag.AiAudio]: true,
          [FeatureFlag.AiVideo]: true,
          [FeatureFlag.AiMusic]: true,
          [FeatureFlag.AiAnalytics]: true,
          [FeatureFlag.AiPrediction]: true,
          [FeatureFlag.AiKnowledge]: true,
          [FeatureFlag.AiTools]: true,
        }}
      >
        <AiStudio />
      </StaticFeatureFlagsProvider>
    </QueryClientProvider>,
  );
}

function installApiMock() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith('/api/V1/ai/capabilities')) {
        return Response.json({
          ok: true,
          data: {
            declared: [
              'text',
              'code',
              'image',
              'audio',
              'video',
              'music',
              'analytics',
              'prediction',
              'knowledge-ingest',
              'retrieval',
              'tool',
            ],
            executable: [
              'text',
              'code',
              'image',
              'audio',
              'video',
              'music',
              'analytics',
              'prediction',
              'knowledge-ingest',
              'retrieval',
              'tool',
            ],
          },
        });
      }

      if (url.endsWith('/api/V1/ai/models')) {
        return Response.json({
          ok: true,
          data: [
            {
              id: '@cf/zai-org/glm-4.7-flash',
              providerId: 'cloudflare-workers-ai',
              capabilities: [
                'text',
                'analytics',
                'prediction',
              ],
            },
            {
              id: '@cf/qwen/qwen2.5-coder-32b-instruct',
              providerId: 'cloudflare-workers-ai',
              capabilities: ['code'],
            },
            {
              id: '@cf/black-forest-labs/flux-1-schnell',
              providerId: 'cloudflare-workers-ai',
              capabilities: ['image'],
            },
          ],
        });
      }

      if (url.endsWith('/api/V1/ai/usage')) {
        return Response.json({
          ok: true,
          data: {
            day: '2026-09-21',
            runs: 3,
            inputUnits: 100,
            outputUnits: 50,
            totalUnits: 150,
            estimatedCostUsd: 0.002,
            limits: {
              dailyRuns: 0,
              dailyCostBudgetUsd: 0,
              runsPerMinute: 60,
            },
          },
        });
      }

      if (url.endsWith('/api/V1/ai/knowledge-bases')) {
        return Response.json({ ok: true, data: [] });
      }

      if (url.endsWith('/api/V1/ai/tools')) {
        return Response.json({ ok: true, data: [] });
      }

      if (url.includes('/api/V1/ai/runs')) {
        return Response.json({
          ok: true,
          data: [],
          pagination: { nextBefore: null },
        });
      }

      throw new Error('Unexpected AI Studio fetch: ' + url);
    }),
  );
}

describe('AiStudio', () => {
  it('intersects Flagship rollout controls with executable capabilities', async () => {
    installApiMock();
    renderStudio();

    expect(await screen.findByText('AI Studio')).toBeTruthy();
    expect(await screen.findByText('AI runtime online')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Chat' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Code' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Media' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Knowledge' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tools' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Runs' })).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('$0.0020')).toBeTruthy();
  });

  it('renders each enabled AI workspace from the shared shell', async () => {
    installApiMock();
    renderStudio();

    await screen.findByText('Chat');

    fireEvent.click(screen.getByRole('button', { name: 'Code' }));
    expect(await screen.findByText('Coding agent')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Media' }));
    expect(await screen.findByText('Media generation')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    expect(
      await screen.findByText('Analytics & prediction'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Knowledge' }));
    expect(await screen.findByText('Knowledge bases')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Tools' }));
    expect(await screen.findByText('Sandbox tools')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Runs' }));
    expect(await screen.findByText('Recent AI runs')).toBeTruthy();
  });
});
