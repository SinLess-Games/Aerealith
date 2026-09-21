import { AiKnowledgeCatalog } from './knowledge-catalog';

function createCatalog() {
  const values = new Map<string, unknown>();
  const ctx = {
    storage: {
      kv: {
        get<T>(key: string): T | undefined {
          return values.get(key) as T | undefined;
        },
        put(key: string, value: unknown) {
          values.set(key, value);
        },
      },
    },
  };

  return new AiKnowledgeCatalog(ctx as never, {} as never);
}

describe('AiKnowledgeCatalog', () => {
  it('creates knowledge bases and records unique documents', async () => {
    const catalog = createCatalog();
    const knowledgeBase = await catalog.createKnowledgeBase({
      tenantId: 'user-123',
      name: ' Product docs ',
      description: ' Documentation ',
    });

    const updated = await catalog.recordDocuments(knowledgeBase.id, [
      'doc-1',
      'doc-1',
      'doc-2',
    ]);

    expect(updated).toMatchObject({
      id: knowledgeBase.id,
      tenantId: 'user-123',
      name: 'Product docs',
      description: 'Documentation',
    });
    expect(updated?.documents.map((document) => document.id)).toEqual([
      'doc-1',
      'doc-2',
    ]);

    await expect(catalog.listKnowledgeBases()).resolves.toEqual([
      expect.objectContaining({
        id: knowledgeBase.id,
        documentCount: 2,
      }),
    ]);
  });

  it('removes one document without deleting the knowledge base', async () => {
    const catalog = createCatalog();
    const knowledgeBase = await catalog.createKnowledgeBase({
      tenantId: 'user-123',
      name: 'Docs',
    });

    await catalog.recordDocuments(knowledgeBase.id, ['doc-1', 'doc-2']);

    await expect(
      catalog.deleteDocument(knowledgeBase.id, 'doc-1'),
    ).resolves.toBe(true);

    await expect(
      catalog.getKnowledgeBase(knowledgeBase.id),
    ).resolves.toMatchObject({
      id: knowledgeBase.id,
      documents: [expect.objectContaining({ id: 'doc-2' })],
    });

    await expect(
      catalog.deleteDocument(knowledgeBase.id, 'missing'),
    ).resolves.toBe(false);
  });

  it('deletes the complete knowledge-base catalog record', async () => {
    const catalog = createCatalog();
    const knowledgeBase = await catalog.createKnowledgeBase({
      tenantId: 'user-123',
      name: 'Docs',
    });

    await expect(catalog.deleteKnowledgeBase(knowledgeBase.id)).resolves.toBe(
      true,
    );
    await expect(
      catalog.getKnowledgeBase(knowledgeBase.id),
    ).resolves.toBeUndefined();
  });
});
