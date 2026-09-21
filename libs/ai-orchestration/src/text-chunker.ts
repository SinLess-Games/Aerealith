import type {
  DocumentChunker,
  KnowledgeChunk,
  KnowledgeDocument,
} from './knowledge';

export type TextChunkerOptions = {
  maxCharacters?: number;
  overlapCharacters?: number;
};

const DEFAULT_MAX_CHARACTERS = 4_000;
const DEFAULT_OVERLAP_CHARACTERS = 400;

export class FixedWindowTextChunker implements DocumentChunker {
  private readonly maxCharacters: number;
  private readonly overlapCharacters: number;

  constructor(options: TextChunkerOptions = {}) {
    this.maxCharacters =
      options.maxCharacters ?? DEFAULT_MAX_CHARACTERS;
    this.overlapCharacters =
      options.overlapCharacters ?? DEFAULT_OVERLAP_CHARACTERS;

    if (!Number.isInteger(this.maxCharacters) || this.maxCharacters <= 0) {
      throw new Error('maxCharacters must be a positive integer.');
    }

    if (
      !Number.isInteger(this.overlapCharacters) ||
      this.overlapCharacters < 0 ||
      this.overlapCharacters >= this.maxCharacters
    ) {
      throw new Error(
        'overlapCharacters must be a non-negative integer smaller than maxCharacters.',
      );
    }
  }

  async chunk(
    document: KnowledgeDocument,
  ): Promise<readonly KnowledgeChunk[]> {
    const text = document.text.trim();
    if (!text) return [];

    const chunks: KnowledgeChunk[] = [];
    const step = this.maxCharacters - this.overlapCharacters;

    for (let start = 0, index = 0; start < text.length; start += step, index++) {
      const end = Math.min(start + this.maxCharacters, text.length);
      const chunkText = text.slice(start, end).trim();

      if (chunkText) {
        chunks.push({
          id: `${document.id}:${index}`,
          documentId: document.id,
          text: chunkText,
          metadata: {
            ...(document.metadata ?? {}),
            chunkIndex: index,
            characterStart: start,
            characterEnd: end,
          },
        });
      }

      if (end >= text.length) break;
    }

    return chunks;
  }
}
