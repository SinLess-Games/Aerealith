// libs/core/src/entities/base.entity.ts

export type BaseEntityInput = {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export function createEntityId(): string {
  return crypto.randomUUID();
}

export abstract class BaseEntity {
  id: string;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;

  protected constructor(input: BaseEntityInput = {}) {
    const now = new Date();

    this.id = input.id ?? createEntityId();
    this.createdAt = input.createdAt ?? now;
    this.updatedAt = input.updatedAt ?? now;
    this.deletedAt = input.deletedAt ?? null;
  }

  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  touch(): void {
    this.updatedAt = new Date();
  }

  softDelete(): void {
    const now = new Date();

    this.deletedAt = now;
    this.updatedAt = now;
  }

  restore(): void {
    this.deletedAt = null;
    this.touch();
  }
}