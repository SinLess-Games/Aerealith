import { AiApiClient, AiApiError } from './ai-api-client';

describe('AiApiClient', () => {
  it('creates idempotent runs without sending trusted identity fields', async () => {
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(new Headers(init?.headers).get('idempotency-key')).toBe(
          'submit-1',
        );

        const body = JSON.parse(String(init?.body)) as Record<
          string,
          unknown
        >;

        expect(body).not.toHaveProperty('tenantId');
        expect(body).not.toHaveProperty('actorId');

        return Response.json({
          ok: true,
          data: {
            id: '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
            status: 'accepted',
            capability: 'text',
            createdAt: '2026-09-21T00:00:00.000Z',
            updatedAt: '2026-09-21T00:00:00.000Z',
          },
        });
      },
    );

    const client = new AiApiClient({
      baseUrl: 'https://api.example.test/',
      fetchImplementation,
    });

    const run = await client.createRun(
      {
        capability: 'text',
        tenantId: 'should-not-leak',
        actorId: 'should-not-leak',
        input: {
          messages: [{ role: 'user', content: 'hello' }],
        },
      },
      { idempotencyKey: 'submit-1' },
    );

    expect(run.status).toBe('accepted');
    expect(fetchImplementation.mock.calls[0]?.[0]).toBe(
      'https://api.example.test/api/V1/ai/runs',
    );
  });

  it('returns paginated run history', async () => {
    const fetchImplementation = vi.fn(async () =>
      Response.json({
        ok: true,
        data: [
          {
            id: 'run-1',
            status: 'succeeded',
            capability: 'text',
            createdAt: '2026-09-21T00:00:00.000Z',
            updatedAt: '2026-09-21T00:01:00.000Z',
          },
        ],
        pagination: {
          nextBefore: '2026-09-21T00:00:00.000Z',
        },
      }),
    );
    const client = new AiApiClient({ fetchImplementation });

    await expect(
      client.listRuns({ limit: 1 }),
    ).resolves.toMatchObject({
      items: [{ id: 'run-1' }],
      nextBefore: '2026-09-21T00:00:00.000Z',
    });

    expect(String(fetchImplementation.mock.calls[0]?.[0])).toContain(
      '/api/V1/ai/runs?limit=1',
    );
  });

  it('deletes an individual knowledge document', async () => {
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(init?.method).toBe('DELETE');
        return new Response(null, { status: 204 });
      },
    );
    const client = new AiApiClient({
      baseUrl: 'https://api.example.test',
      fetchImplementation,
    });

    await client.deleteKnowledgeDocument('kb-1', 'doc/one');

    expect(fetchImplementation.mock.calls[0]?.[0]).toBe(
      'https://api.example.test/api/V1/ai/knowledge-bases/kb-1/documents/doc%2Fone',
    );
  });

  it('maps API failures to AiApiError', async () => {
    const client = new AiApiClient({
      fetchImplementation: vi.fn(async () =>
        Response.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many AI runs.',
              requestId: 'request-1',
            },
          },
          { status: 429 },
        ),
      ),
    });

    await expect(client.usage()).rejects.toMatchObject({
      name: 'AiApiError',
      status: 429,
      code: 'RATE_LIMITED',
      requestId: 'request-1',
      message: 'Too many AI runs.',
    } satisfies Partial<AiApiError>);
  });

  it('streams text and returns the durable run id', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
          ),
        );
        controller.close();
      },
    });
    const fetchImplementation = vi.fn(async () =>
      new Response(stream, {
        headers: {
          'content-type': 'text/event-stream',
          'x-ai-run-id': 'run-stream-1',
        },
      }),
    );
    const client = new AiApiClient({ fetchImplementation });

    const result = await client.streamText({
      capability: 'text',
      tenantId: 'must-not-leak',
      input: {
        messages: [{ role: 'user', content: 'hello' }],
      },
    });

    expect(result.runId).toBe('run-stream-1');
    await expect(new Response(result.stream).text()).resolves.toContain(
      '"content":"Hi"',
    );

    const [, init] = fetchImplementation.mock.calls[0] ?? [];
    expect(JSON.parse(String(init?.body))).not.toHaveProperty('tenantId');
  });

  it('returns an authenticated run-event stream', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'event: run\ndata: {"status":"running"}\n\n',
          ),
        );
        controller.close();
      },
    });
    const fetchImplementation = vi.fn(
      async () =>
        new Response(body, {
          headers: { 'content-type': 'text/event-stream' },
        }),
    );
    const client = new AiApiClient({ fetchImplementation });

    const stream = await client.runEvents('run-1');
    const text = await new Response(stream).text();

    expect(text).toContain('"status":"running"');
  });
});
