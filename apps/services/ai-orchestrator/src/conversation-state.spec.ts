import {
  AiConversationState,
  type ConversationRecord,
} from './conversation-state';

function createConversationState() {
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
        delete(key: string) {
          return values.delete(key);
        },
      },
    },
  };

  return new AiConversationState(ctx as never, {} as never);
}

describe('AiConversationState', () => {
  it('persists messages and deduplicates stable message ids', async () => {
    const state = createConversationState();
    const conversation: ConversationRecord = {
      id: 'conv-1',
      tenantId: 'user-123',
      title: 'Test',
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:00.000Z',
      messages: [],
    };
    await state.createConversation(conversation);

    await state.appendMessage({
      id: 'assistant:run-1',
      role: 'assistant',
      content: 'Hello',
      runId: 'run-1',
      createdAt: '2026-09-21T00:01:00.000Z',
    });
    await state.appendMessage({
      id: 'assistant:run-1',
      role: 'assistant',
      content: 'Hello',
      runId: 'run-1',
      createdAt: '2026-09-21T00:01:00.000Z',
    });

    const stored = await state.getConversation();

    expect(stored?.messages).toHaveLength(1);
    expect(stored?.messages[0]).toMatchObject({
      role: 'assistant',
      runId: 'run-1',
    });
  });

  it('deletes conversation state', async () => {
    const state = createConversationState();
    await state.createConversation({
      id: 'conv-1',
      tenantId: 'user-123',
      title: 'Test',
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:00.000Z',
      messages: [],
    });

    await state.deleteConversation();

    await expect(state.getConversation()).resolves.toBeUndefined();
  });
});
