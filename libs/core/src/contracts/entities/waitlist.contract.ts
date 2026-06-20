// libs/core/src/contracts/entities/waitlist.contract.ts

import type { IsoDateString } from '../api.contract';

/**
 * A waitlist entry returned by the API.
 */
export type WaitlistContract = {
  id: string;
  email: string;
  createdAt: IsoDateString;
};

/**
 * Data required to join the waitlist.
 */
export type JoinWaitlistContract = {
  email: string;
};