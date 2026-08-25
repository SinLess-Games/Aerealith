// libs/core/src/entities/system/waitlist.entity.ts

import { BaseEntity, type BaseEntityInput } from '../base.entity';

export type WaitlistInput = BaseEntityInput & {
  email: string;
  role?: string | null;
};

export class WaitlistEntity extends BaseEntity {
  email: string;
  role: string | null;

  constructor(input: WaitlistInput) {
    super(input);

    this.email = this.normalizeEmail(input.email);
    this.role = input.role?.trim() || null;
  }

  updateEmail(email: string): void {
    this.email = this.normalizeEmail(email);
    this.touch();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
