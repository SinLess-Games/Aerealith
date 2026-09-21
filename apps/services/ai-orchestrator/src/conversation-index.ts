import { DurableObject } from 'cloudflare:workers';

import type { AiOrchestratorBindings } from './bindings';
import type { ConversationSummary } from './conversation-state';

const INDEX_KEY = 'conversations';
const MAX_CONVERSATIONS = 500;

export type ConversationPage = {
  items: readonly ConversationSummary[];
  nextBefore?: string;
};

export class AiConversationIndex extends DurableObject<AiOrchestratorBindings> {
  async upsertConversation(
    conversation: ConversationSummary,
  ): Promise<void> {
    const current =
      this.ctx.storage.kv.get<ConversationSummary[]>(INDEX_KEY) ?? [];
    const next = [
      conversation,
      ...current.filter(
        (candidate) => candidate.id !== conversation.id,
      ),
    ]
      .sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      )
      .slice(0, MAX_CONVERSATIONS);

    this.ctx.storage.kv.put(INDEX_KEY, next);
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const current =
      this.ctx.storage.kv.get<ConversationSummary[]>(INDEX_KEY) ?? [];

    this.ctx.storage.kv.put(
      INDEX_KEY,
      current.filter(
        (conversation) => conversation.id !== conversationId,
      ),
    );
  }

  async listConversations(
    limit = 50,
    before?: string,
  ): Promise<ConversationPage> {
    const boundedLimit = Math.max(1, Math.min(limit, 100));
    const current =
      this.ctx.storage.kv.get<ConversationSummary[]>(INDEX_KEY) ?? [];
    const filtered = before
      ? current.filter(
          (conversation) => conversation.updatedAt < before,
        )
      : current;
    const items = filtered.slice(0, boundedLimit);
    const last = items.at(-1);

    return {
      items,
      ...(filtered.length > items.length && last
        ? { nextBefore: last.updatedAt }
        : {}),
    };
  }
}
