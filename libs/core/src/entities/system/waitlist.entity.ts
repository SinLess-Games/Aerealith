// libs/core/src/entities/system/waitlist.entity.ts

import { BaseEntity, type BaseEntityInput } from '../base.entity'

export type WaitlistInput = BaseEntityInput & {
  email: string
}

export class WaitlistEntity extends BaseEntity {
  email: string

  constructor(input: WaitlistInput) {
    super(input)

    this.email = this.normalizeEmail(input.email)
  }

  updateEmail(email: string): void {
    this.email = this.normalizeEmail(email)
    this.touch()
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }
}
