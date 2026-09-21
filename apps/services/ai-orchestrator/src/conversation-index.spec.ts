import type { ConversationSummary } from './conversation-state';
import { AiConversationIndex } from './conversation-index';

function createIndex() {
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

  return new AiConversationIndex(ctx as never, {} as never);
}

function conversation(
  id: string,
  updatedAt: string,
  messageCount = 0,
): ConversationSummary {
  return {
    id,
    tenantId: 'user-123',
    title: id,
    createdAt: '2026-09-21T00:00:00.000Z',
    updatedAt,
    messageCount,
  };
}

describe('AiConversationIndex', () => {
  it('lists the most recently updated conversations first', async () => {
    const index = createIndex();

    await index.upsertConversation(
      conversation('older', '2026-09-21T00:01:00.000Z'),
    );
    await index.upsertConversation(
      conversation('newer', '2026-09-21T00:02:00.000Z'),
    );

    await expect(index.listConversations(10)).resolves.toMatchObject({
      items: [
        expect.objectContaining({ id: 'newer' }),
        expect.objectContaining({ id: 'older' }),
      ],
    });
  });

  it('updates an existing conversation without duplicating it', async () => {
    const index = createIndex();

    await index.upsertConversation(
      conversation('chat-1', '2026-09-21T00:01:00.000Z', 1),
    );
    await index.upsertConversation(
      conversation('chat-1', '2026-09-21T00:02:00.000Z', 2),
    );

    const page = await index.listConversations(10);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      id: 'chat-1',
      messageCount: 2,
    });
  });

  it('deletes conversation summaries', async () => {
    const index = createIndex();

    await index.upsertConversation(
      conversation('chat-1', '2026-09-21T00:01:00.000Z'),
    );
    await index.deleteConversation('chat-1');

    await expect(index.listConversations(10)).resolves.toEqual({
      items: [],
    });
  });
});
