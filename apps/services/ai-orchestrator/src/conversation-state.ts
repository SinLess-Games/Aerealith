import { DurableObject } from 'cloudflare:workers';

import type { AiOrchestratorBindings } from './bindings';

const CONVERSATION_KEY = 'conversation';
const MAX_MESSAGES = 1_000;

export type ConversationRole = 'system' | 'user' | 'assistant' | 'tool';

export type ConversationMessage = {
  id: string;
  role: ConversationRole;
  content: string;
  name?: string;
  runId?: string;
  createdAt: string;
};

export type ConversationRecord = {
  id: string;
  tenantId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: readonly ConversationMessage[];
};

export type ConversationSummary = Omit<ConversationRecord, 'messages'> & {
  messageCount: number;
};

export class AiConversationState extends DurableObject<AiOrchestratorBindings> {
  async createConversation(
    conversation: ConversationRecord,
  ): Promise<ConversationRecord> {
    const existing =
      this.ctx.storage.kv.get<ConversationRecord>(CONVERSATION_KEY);

    if (existing) return existing;

    this.ctx.storage.kv.put(CONVERSATION_KEY, conversation);
    return conversation;
  }

  async getConversation(): Promise<ConversationRecord | undefined> {
    return this.ctx.storage.kv.get<ConversationRecord>(CONVERSATION_KEY);
  }

  async appendMessage(
    message: ConversationMessage,
  ): Promise<ConversationRecord> {
    const conversation = this.requireConversation();

    if (conversation.messages.length >= MAX_MESSAGES) {
      throw new Error(
        `Conversation message limit of ${MAX_MESSAGES} has been reached.`,
      );
    }

    const existing = conversation.messages.find(
      (candidate) => candidate.id === message.id,
    );
    if (existing) return conversation;

    const updated: ConversationRecord = {
      ...conversation,
      updatedAt: new Date().toISOString(),
      messages: [...conversation.messages, message],
    };

    this.ctx.storage.kv.put(CONVERSATION_KEY, updated);
    return updated;
  }

  async deleteConversation(): Promise<void> {
    this.ctx.storage.kv.delete(CONVERSATION_KEY);
  }

  private requireConversation(): ConversationRecord {
    const conversation =
      this.ctx.storage.kv.get<ConversationRecord>(CONVERSATION_KEY);

    if (!conversation) {
      throw new Error('AI conversation has not been initialized.');
    }

    return conversation;
  }
}
