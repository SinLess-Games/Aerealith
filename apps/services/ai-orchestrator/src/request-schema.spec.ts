import { orchestrationRequestSchema } from './request-schema';

describe('orchestrationRequestSchema', () => {
  it('accepts normalized text generation requests', () => {
    const parsed = orchestrationRequestSchema.parse({
      capability: 'text',
      input: {
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
        maxOutputTokens: 256,
      },
    });

    expect(parsed).toMatchObject({
      capability: 'text',
      input: {
        messages: [{ role: 'user', content: 'Hello' }],
        maxOutputTokens: 256,
      },
    });
  });

  it('rejects code requests without a mode and instruction', () => {
    const parsed = orchestrationRequestSchema.safeParse({
      capability: 'code',
      input: {
        prompt: 'Write a function.',
      },
    });

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) =>
        issue.path[0] === 'input',
      )).toBe(true);
    }
  });

  it('requires an audio text or prompt source', () => {
    const parsed = orchestrationRequestSchema.safeParse({
      capability: 'audio',
      input: {
        voice: 'narrator',
      },
    });

    expect(parsed.success).toBe(false);
  });

  it('bounds embedding batch size', () => {
    const parsed = orchestrationRequestSchema.safeParse({
      capability: 'embedding',
      input: {
        texts: Array.from({ length: 257 }, (_, index) => `text-${index}`),
      },
    });

    expect(parsed.success).toBe(false);
  });

  it('accepts bounded knowledge ingestion documents', () => {
    const parsed = orchestrationRequestSchema.parse({
      capability: 'knowledge-ingest',
      input: {
        namespace: 'kb-1',
        documents: [
          {
            id: 'doc-1',
            text: 'Aerealith documentation',
            metadata: { source: 'docs' },
          },
        ],
        chunking: {
          maxCharacters: 4000,
          overlapCharacters: 400,
        },
      },
    });

    expect(parsed).toMatchObject({
      capability: 'knowledge-ingest',
      input: {
        namespace: 'kb-1',
        documents: [{ id: 'doc-1' }],
      },
    });
  });

  it('rejects empty knowledge ingestion batches', () => {
    const parsed = orchestrationRequestSchema.safeParse({
      capability: 'knowledge-ingest',
      input: {
        namespace: 'kb-1',
        documents: [],
      },
    });

    expect(parsed.success).toBe(false);
  });

  it('accepts retrieval filters while requiring namespace isolation input', () => {
    const parsed = orchestrationRequestSchema.parse({
      capability: 'retrieval',
      input: {
        namespace: 'tenant-a:kb-1',
        query: 'What changed?',
        limit: 10,
        filter: {
          source: 'documentation',
        },
      },
    });

    expect(parsed.input).toMatchObject({
      namespace: 'tenant-a:kb-1',
      query: 'What changed?',
      limit: 10,
    });
  });
});
