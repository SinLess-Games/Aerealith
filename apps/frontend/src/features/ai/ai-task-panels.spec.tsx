// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AiAnalyzePanel,
  AiCodePanel,
  AiMediaPanel,
  AiToolsPanel,
} from './ai-task-panels';

afterEach(() => vi.unstubAllGlobals());

function renderWithQuery(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>,
  );
}

function succeededRun(
  capability:
    | 'code'
    | 'image'
    | 'analytics'
    | 'prediction'
    | 'tool',
  content: unknown,
  artifacts?: string[],
) {
  return {
    ok: true,
    data: {
      id: 'run-1',
      status: 'succeeded',
      capability,
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:01.000Z',
      providerId: 'cloudflare-workers-ai',
      modelId: 'model-1',
      output: {
        content,
        providerId: 'cloudflare-workers-ai',
        modelId: 'model-1',
        ...(artifacts ? { artifacts } : {}),
      },
    },
  };
}

describe('AI task panels', () => {
  it('submits coding work and renders the returned summary', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        expect(String(input)).toBe('/api/V1/ai/runs');
        return Response.json(
          succeededRun('code', {
            summary: 'Updated and tested the repository.',
            changedFiles: ['src/index.ts'],
          }),
        );
      }),
    );

    renderWithQuery(
      <AiCodePanel
        models={[
          {
            id: 'code-model',
            providerId: 'cloudflare-workers-ai',
            capabilities: ['code'],
          },
        ]}
        modelSelectorEnabled
      />,
    );

    fireEvent.change(screen.getByLabelText('Instruction'), {
      target: { value: 'Update the implementation.' },
    });
    fireEvent.change(
      screen.getByLabelText('Public GitHub repository'),
      {
        target: {
          value: 'https://github.com/example/repo.git',
        },
      },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Run coding task' }),
    );

    expect(
      await screen.findByText('Updated and tested the repository.'),
    ).toBeTruthy();
    expect(screen.getByText('succeeded')).toBeTruthy();
  });

  it('submits media generation and exposes generated artifacts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          succeededRun(
            'image',
            {
              artifacts: [
                {
                  id: 'artifact-1',
                  kind: 'image',
                  contentType: 'image/png',
                },
              ],
            },
            ['artifact-1'],
          ),
        ),
      ),
    );

    renderWithQuery(
      <AiMediaPanel
        capabilities={['image']}
        models={[]}
        modelSelectorEnabled={false}
      />,
    );

    fireEvent.change(screen.getByLabelText('Prompt'), {
      target: { value: 'A glowing orbital station' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Generate image' }),
    );

    const artifact = await screen.findByRole('link', {
      name: 'Open artifact 1',
    });
    expect(artifact.getAttribute('href')).toBe(
      '/api/V1/ai/artifacts/artifact-1',
    );
  });

  it('validates analytics JSON before creating a run', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderWithQuery(
      <AiAnalyzePanel
        capabilities={['analytics']}
        models={[]}
        modelSelectorEnabled={false}
      />,
    );

    fireEvent.change(screen.getByLabelText('Question'), {
      target: { value: 'Summarize this dataset.' },
    });
    fireEvent.change(screen.getByLabelText('Data (optional JSON)'), {
      target: { value: '{invalid' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Run analysis' }),
    );

    expect(await screen.findByText('Data must be valid JSON.')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requires approval before invoking a mutating sandbox tool', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url === '/api/V1/ai/tools') {
          return Response.json({
            ok: true,
            data: [
              {
                name: 'sandbox.write_file',
                description: 'Write a file.',
                inputSchema: { type: 'object' },
                requiresApproval: true,
              },
            ],
          });
        }

        if (url === '/api/V1/ai/runs') {
          return Response.json(
            succeededRun('tool', {
              output: 'written',
            }),
          );
        }

        throw new Error('Unexpected fetch: ' + url);
      }),
    );

    renderWithQuery(<AiToolsPanel />);

    const select = await screen.findByLabelText('Tool');
    fireEvent.change(select, {
      target: { value: 'sandbox.write_file' },
    });

    const runButton = screen.getByRole('button', { name: 'Run tool' });
    expect((runButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(
      screen.getByRole('checkbox'),
    );
    expect((runButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(runButton);
    expect(await screen.findByText('succeeded')).toBeTruthy();
  });
});
