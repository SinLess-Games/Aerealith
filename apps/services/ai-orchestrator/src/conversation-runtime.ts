import type {
  ConversationIndexNamespace,
  ConversationStateNamespace,
} from './bindings';
import type {
  ConversationMessage,
  ConversationRecord,
  ConversationSummary,
} from './conversation-state';

export class ConversationStore {
  constructor(
    private readonly states: ConversationStateNamespace,
    private readonly index: ConversationIndexNamespace,
  ) {}

  async create(
    tenantId: string,
    title = 'New conversation',
  ): Promise<ConversationRecord> {
    const timestamp = new Date().toISOString();
    const conversation: ConversationRecord = {
      id: crypto.randomUUID(),
      tenantId,
      title: normalizeTitle(title),
      createdAt: timestamp,
      updatedAt: timestamp,
      messages: [],
    };

    const created = await this.state(
      tenantId,
      conversation.id,
    ).createConversation(conversation);
    await this.indexFor(tenantId).upsertConversation(
      toSummary(created),
    );

    return created;
  }

  get(
    tenantId: string,
    conversationId: string,
  ): Promise<ConversationRecord | undefined> {
    return this.state(tenantId, conversationId).getConversation();
  }

  async append(
    tenantId: string,
    conversationId: string,
    message: Omit<ConversationMessage, 'id' | 'createdAt'> & {
      id?: string;
      createdAt?: string;
    },
  ): Promise<ConversationRecord | undefined> {
    const state = this.state(tenantId, conversationId);
    const existing = await state.getConversation();
    if (!existing || existing.tenantId !== tenantId) return undefined;

    const updated = await state.appendMessage({
      ...message,
      id: message.id ?? crypto.randomUUID(),
      createdAt: message.createdAt ?? new Date().toISOString(),
    });

    await this.indexFor(tenantId).upsertConversation(toSummary(updated));
    return updated;
  }

  async list(
    tenantId: string,
    limit = 50,
    before?: string,
  ) {
    return this.indexFor(tenantId).listConversations(limit, before);
  }

  async delete(
    tenantId: string,
    conversationId: string,
  ): Promise<boolean> {
    const state = this.state(tenantId, conversationId);
    const existing = await state.getConversation();

    if (!existing || existing.tenantId !== tenantId) return false;

    await state.deleteConversation();
    await this.indexFor(tenantId).deleteConversation(conversationId);
    return true;
  }

  private state(tenantId: string, conversationId: string) {
    return this.states.get(
      this.states.idFromName(`${tenantId}:${conversationId}`),
    );
  }

  private indexFor(tenantId: string) {
    return this.index.get(this.index.idFromName(tenantId));
  }
}

export function toSummary(
  conversation: ConversationRecord,
): ConversationSummary {
  return {
    id: conversation.id,
    tenantId: conversation.tenantId,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messageCount: conversation.messages.length,
  };
}

function normalizeTitle(value: string): string {
  const title = value.trim();
  return title || 'New conversation';
}
