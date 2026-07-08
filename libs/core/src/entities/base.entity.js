'use strict';
// libs/core/src/entities/base.entity.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.BaseEntity = void 0;
exports.createEntityId = createEntityId;
function createEntityId() {
  return crypto.randomUUID();
}
class BaseEntity {
  id;
  createdAt;
  updatedAt;
  deletedAt;
  constructor(input = {}) {
    const now = new Date();
    this.id = input.id ?? createEntityId();
    this.createdAt = input.createdAt ?? now;
    this.updatedAt = input.updatedAt ?? now;
    this.deletedAt = input.deletedAt ?? null;
  }
  get isDeleted() {
    return this.deletedAt !== null;
  }
  touch() {
    this.updatedAt = new Date();
  }
  softDelete() {
    const now = new Date();
    this.deletedAt = now;
    this.updatedAt = now;
  }
  restore() {
    this.deletedAt = null;
    this.touch();
  }
}
exports.BaseEntity = BaseEntity;
//# sourceMappingURL=base.entity.js.map
