import { BaseEntity, type BaseEntityInput } from '../base.entity';
export type UserAccountStatus = 'active' | 'revoked' | 'suspended' | 'expired';
export type UserAccountInput = BaseEntityInput & {
  userId: string;
  provider: string;
  accountId: string;
  displayName: string;
  managementUrl?: string | null;
  status?: UserAccountStatus;
  connectedAt?: Date;
};
export declare class UserAccountEntity extends BaseEntity {
  userId: string;
  provider: string;
  accountId: string;
  displayName: string;
  managementUrl: string | null;
  status: UserAccountStatus;
  connectedAt: Date;
  constructor(input: UserAccountInput);
  activate(): void;
  revoke(): void;
  suspend(): void;
  expire(): void;
  updateDisplayName(displayName: string): void;
  updateManagementUrl(managementUrl?: string | null): void;
  private normalizeProvider;
  private normalizeOptionalUrl;
}
