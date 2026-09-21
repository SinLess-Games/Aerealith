import { FixedWindowTextChunker } from './text-chunker';

describe('FixedWindowTextChunker', () => {
  it('creates deterministic overlapping chunks', async () => {
    const chunker = new FixedWindowTextChunker({
      maxCharacters: 10,
      overlapCharacters: 2,
    });

    const chunks = await chunker.chunk({
      id: 'doc',
      text: 'abcdefghijklmnop',
      metadata: { source: 'test' },
    });

    expect(chunks).toEqual([
      {
        id: 'doc:0',
        documentId: 'doc',
        text: 'abcdefghij',
        metadata: {
          source: 'test',
          chunkIndex: 0,
          characterStart: 0,
          characterEnd: 10,
        },
      },
      {
        id: 'doc:1',
        documentId: 'doc',
        text: 'ijklmnop',
        metadata: {
          source: 'test',
          chunkIndex: 1,
          characterStart: 8,
          characterEnd: 16,
        },
      },
    ]);
  });

  it('ignores empty documents', async () => {
    const chunker = new FixedWindowTextChunker();
    await expect(
      chunker.chunk({ id: 'empty', text: '   ' }),
    ).resolves.toEqual([]);
  });

  it('rejects overlap that would prevent forward progress', () => {
    expect(
      () =>
        new FixedWindowTextChunker({
          maxCharacters: 100,
          overlapCharacters: 100,
        }),
    ).toThrow('smaller than maxCharacters');
  });
});
