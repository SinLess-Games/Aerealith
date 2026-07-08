'use strict';
// libs/core/src/entities/system/waitlist.entity.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.WaitlistEntity = void 0;
const base_entity_1 = require('../base.entity');
class WaitlistEntity extends base_entity_1.BaseEntity {
  email;
  constructor(input) {
    super(input);
    this.email = this.normalizeEmail(input.email);
  }
  updateEmail(email) {
    this.email = this.normalizeEmail(email);
    this.touch();
  }
  normalizeEmail(email) {
    return email.trim().toLowerCase();
  }
}
exports.WaitlistEntity = WaitlistEntity;
//# sourceMappingURL=waitlist.entity.js.map
