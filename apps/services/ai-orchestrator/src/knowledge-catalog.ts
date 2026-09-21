import { DurableObject } from 'cloudflare:workers';

import type { AiOrchestratorBindings } from './bindings';

const CATALOG_KEY = 'knowledge-bases';
const MAX_KNOWLEDGE_BASES = 100;
const MAX_DOCUMENTS_PER_BASE = 10_000;

export type KnowledgeDocumentRecord = {
  id: string;
  createdAt: string;
};

export type KnowledgeBaseRecord = {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  documents: readonly KnowledgeDocumentRecord[];
};

export type KnowledgeBaseSummary = Omit<
  KnowledgeBaseRecord,
  'documents'
> & {
  documentCount: number;
};

export class AiKnowledgeCatalog extends DurableObject<AiOrchestratorBindings> {
  async createKnowledgeBase(input: {
    tenantId: string;
    name: string;
    description?: string;
  }): Promise<KnowledgeBaseRecord> {
    const catalog = this.catalog();

    if (catalog.length >= MAX_KNOWLEDGE_BASES) {
      throw new Error(
        `Knowledge-base limit of ${MAX_KNOWLEDGE_BASES} has been reached.`,
      );
    }

    const timestamp = new Date().toISOString();
    const knowledgeBase: KnowledgeBaseRecord = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      name: input.name.trim(),
      ...(input.description?.trim()
        ? { description: input.description.trim() }
        : {}),
      createdAt: timestamp,
      updatedAt: timestamp,
      documents: [],
    };

    this.save([knowledgeBase, ...catalog]);
    return knowledgeBase;
  }

  async getKnowledgeBase(
    id: string,
  ): Promise<KnowledgeBaseRecord | undefined> {
    return this.catalog().find((item) => item.id === id);
  }

  async listKnowledgeBases(): Promise<
    readonly KnowledgeBaseSummary[]
  > {
    return this.catalog()
      .map(toSummary)
      .sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      );
  }

  async recordDocuments(
    knowledgeBaseId: string,
    documentIds: readonly string[],
  ): Promise<KnowledgeBaseRecord | undefined> {
    const catalog = this.catalog();
    const index = catalog.findIndex(
      (item) => item.id === knowledgeBaseId,
    );
    if (index < 0) return undefined;

    const current = catalog[index]!;
    const existing = new Map(
      current.documents.map((document) => [document.id, document]),
    );
    const timestamp = new Date().toISOString();

    for (const id of documentIds) {
      if (!existing.has(id)) {
        existing.set(id, {
          id,
          createdAt: timestamp,
        });
      }
    }

    const documents = [...existing.values()];
    if (documents.length > MAX_DOCUMENTS_PER_BASE) {
      throw new Error(
        `Knowledge base may contain at most ${MAX_DOCUMENTS_PER_BASE} documents.`,
      );
    }

    const updated: KnowledgeBaseRecord = {
      ...current,
      updatedAt: timestamp,
      documents,
    };

    catalog[index] = updated;
    this.save(catalog);
    return updated;
  }

  async deleteDocument(
    knowledgeBaseId: string,
    documentId: string,
  ): Promise<boolean> {
    const catalog = this.catalog();
    const index = catalog.findIndex(
      (item) => item.id === knowledgeBaseId,
    );
    if (index < 0) return false;

    const current = catalog[index]!;
    const documents = current.documents.filter(
      (document) => document.id !== documentId,
    );

    if (documents.length === current.documents.length) {
      return false;
    }

    catalog[index] = {
      ...current,
      updatedAt: new Date().toISOString(),
      documents,
    };
    this.save(catalog);
    return true;
  }

  async deleteKnowledgeBase(id: string): Promise<boolean> {
    const catalog = this.catalog();
    const next = catalog.filter((item) => item.id !== id);

    if (next.length === catalog.length) return false;

    this.save(next);
    return true;
  }

  private catalog(): KnowledgeBaseRecord[] {
    return (
      this.ctx.storage.kv.get<KnowledgeBaseRecord[]>(CATALOG_KEY) ?? []
    );
  }

  private save(catalog: readonly KnowledgeBaseRecord[]): void {
    this.ctx.storage.kv.put(CATALOG_KEY, [...catalog]);
  }
}

function toSummary(
  knowledgeBase: KnowledgeBaseRecord,
): KnowledgeBaseSummary {
  const { documents, ...summary } = knowledgeBase;

  return {
    ...summary,
    documentCount: documents.length,
  };
}
