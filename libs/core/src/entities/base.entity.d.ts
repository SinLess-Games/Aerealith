export type BaseEntityInput = {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};
export declare function createEntityId(): string;
export declare abstract class BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  protected constructor(input?: BaseEntityInput);
  get isDeleted(): boolean;
  touch(): void;
  softDelete(): void;
  restore(): void;
}
