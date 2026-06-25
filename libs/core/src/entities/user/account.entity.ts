import { BaseEntity, type BaseEntityInput } from '../base.entity'

export type UserAccountStatus = 'active' | 'revoked' | 'suspended' | 'expired'

export type UserAccountInput = BaseEntityInput & {
  userId: string
  provider: string
  accountId: string
  displayName: string
  managementUrl?: string | null
  status?: UserAccountStatus
  connectedAt?: Date
}

export class UserAccountEntity extends BaseEntity {
  userId: string

  provider: string

  accountId: string

  displayName: string

  managementUrl: string | null

  status: UserAccountStatus

  connectedAt: Date

  constructor(input: UserAccountInput) {
    super(input)

    this.userId = input.userId
    this.provider = this.normalizeProvider(input.provider)
    this.accountId = input.accountId.trim()
    this.displayName = input.displayName.trim()
    this.managementUrl = this.normalizeOptionalUrl(input.managementUrl)
    this.status = input.status ?? 'active'
    this.connectedAt = input.connectedAt ?? new Date()
  }

  activate(): void {
    this.status = 'active'
    this.touch()
  }

  revoke(): void {
    this.status = 'revoked'
    this.touch()
  }

  suspend(): void {
    this.status = 'suspended'
    this.touch()
  }

  expire(): void {
    this.status = 'expired'
    this.touch()
  }

  updateDisplayName(displayName: string): void {
    this.displayName = displayName.trim()
    this.touch()
  }

  updateManagementUrl(managementUrl?: string | null): void {
    this.managementUrl = this.normalizeOptionalUrl(managementUrl)
    this.touch()
  }

  private normalizeProvider(provider: string): string {
    return provider.trim().toLowerCase()
  }

  private normalizeOptionalUrl(value?: string | null): string | null {
    return value?.trim() || null
  }
}
