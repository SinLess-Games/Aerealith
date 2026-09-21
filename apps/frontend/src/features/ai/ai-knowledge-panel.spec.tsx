// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AiKnowledgePanel } from './ai-knowledge-panel';

afterEach(() => vi.unstubAllGlobals());

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <AiKnowledgePanel />
    </QueryClientProvider>,
  );
}

describe('AiKnowledgePanel', () => {
  it('lists, ingests, and deletes knowledge documents', async () => {
    let documents = [
      {
        id: 'doc-1',
        createdAt: '2026-09-21T00:00:00.000Z',
      },
    ];

    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url === '/api/V1/ai/knowledge-bases' && method === 'GET') {
          return Response.json({
            ok: true,
            data: [
              {
                id: 'kb-1',
                tenantId: 'user-1',
                name: 'Product docs',
                createdAt: '2026-09-21T00:00:00.000Z',
                updatedAt: '2026-09-21T00:00:00.000Z',
                documentCount: documents.length,
              },
            ],
          });
        }

        if (
          url === '/api/V1/ai/knowledge-bases/kb-1' &&
          method === 'GET'
        ) {
          return Response.json({
            ok: true,
            data: {
              id: 'kb-1',
              tenantId: 'user-1',
              name: 'Product docs',
              createdAt: '2026-09-21T00:00:00.000Z',
              updatedAt: '2026-09-21T00:00:00.000Z',
              documents,
            },
          });
        }

        if (
          url === '/api/V1/ai/knowledge-bases/kb-1/documents' &&
          method === 'POST'
        ) {
          documents = [
            ...documents,
            {
              id: 'doc-2',
              createdAt: '2026-09-21T00:00:02.000Z',
            },
          ];

          return Response.json({
            ok: true,
            data: {
              id: 'run-ingest',
              status: 'succeeded',
              capability: 'knowledge-ingest',
              createdAt: '2026-09-21T00:00:01.000Z',
              updatedAt: '2026-09-21T00:00:02.000Z',
              providerId: 'cloudflare-workers-ai',
              modelId: 'embedding-model',
              output: {
                content: {
                  namespace: 'kb-1',
                  documentsProcessed: 1,
                  chunksWritten: 1,
                  embeddingModelId: 'embedding-model',
                },
                providerId: 'cloudflare-workers-ai',
                modelId: 'embedding-model',
              },
            },
          });
        }

        if (
          url ===
            '/api/V1/ai/knowledge-bases/kb-1/documents/doc-1' &&
          method === 'DELETE'
        ) {
          documents = documents.filter(
            (document) => document.id !== 'doc-1',
          );
          return new Response(null, { status: 204 });
        }

        throw new Error(
          'Unexpected knowledge fetch: ' + method + ' ' + url,
        );
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    renderPanel();

    expect(await screen.findByText('Product docs')).toBeTruthy();
    expect(await screen.findByText('doc-1')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Document ID'), {
      target: { value: 'doc-2' },
    });
    fireEvent.change(screen.getByLabelText('Document text'), {
      target: { value: 'Aerealith architecture notes.' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Ingest document' }),
    );

    expect(await screen.findByText('doc-2')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Delete doc-1' }),
    );

    await waitFor(() => {
      expect(screen.queryByText('doc-1')).toBeNull();
    });

    expect(fetchMock).toHaveBeenCalled();
  });
});
