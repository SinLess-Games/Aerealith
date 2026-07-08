import { BaseEntity, type BaseEntityInput } from '../base.entity';
export type WaitlistInput = BaseEntityInput & {
  email: string;
};
export declare class WaitlistEntity extends BaseEntity {
  email: string;
  constructor(input: WaitlistInput);
  updateEmail(email: string): void;
  private normalizeEmail;
}
