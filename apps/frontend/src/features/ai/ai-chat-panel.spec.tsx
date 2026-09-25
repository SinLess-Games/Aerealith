// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AiChatPanel } from './ai-chat-panel';

afterEach(() => vi.unstubAllGlobals());

function wrapper(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

describe('AiChatPanel', () => {
  it('creates a conversation and streams the assistant response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url === '/api/V1/ai/conversations') {
          return Response.json({
            ok: true,
            data: {
              id: 'conversation-1',
              tenantId: 'user-1',
              title: 'Hello',
              createdAt: '2026-09-21T00:00:00.000Z',
              updatedAt: '2026-09-21T00:00:00.000Z',
              messages: [],
            },
          });
        }

        if (
          url ===
          '/api/V1/ai/conversations/conversation-1/messages'
        ) {
          return Response.json({
            ok: true,
            data: {
              id: 'conversation-1',
              tenantId: 'user-1',
              title: 'Hello',
              createdAt: '2026-09-21T00:00:00.000Z',
              updatedAt: '2026-09-21T00:00:01.000Z',
              messages: [],
            },
          });
        }

        if (url === '/api/V1/ai/stream') {
          const encoder = new TextEncoder();
          const stream = new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(
                encoder.encode(
                  'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
                ),
              );
              controller.enqueue(
                encoder.encode(
                  'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
                ),
              );
              controller.close();
            },
          });

          return new Response(stream, {
            headers: {
              'content-type': 'text/event-stream',
              'x-ai-run-id': 'run-1',
            },
          });
        }

        throw new Error('Unexpected fetch: ' + url);
      }),
    );

    render(
      wrapper(
        <AiChatPanel
          models={[
            {
              id: '@cf/test/model',
              providerId: 'cloudflare-workers-ai',
              capabilities: ['text'],
            },
          ]}
          modelSelectorEnabled
          streamingEnabled
        />,
      ),
    );

    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'Message Aerealith',
      }),
      {
        target: { value: 'Hello' },
      },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Send message' }),
    );

    expect(await screen.findByText('Hello')).toBeTruthy();
    expect(
      await screen.findByText('Saved conversation'),
    ).toBeTruthy();
    expect(
      screen.getByRole('combobox', { name: 'Model' }),
    ).toBeTruthy();
  });

  it('resets the local conversation when New is selected', () => {
    render(
      wrapper(
        <AiChatPanel
          models={[]}
          modelSelectorEnabled={false}
          streamingEnabled={false}
        />,
      ),
    );

    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'Message Aerealith',
      }),
      {
        target: { value: 'draft' },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: 'New' }));

    expect(
      (
        screen.getByRole('textbox', {
          name: 'Message Aerealith',
        }) as HTMLTextAreaElement
      ).value,
    ).toBe('');
  });
});
