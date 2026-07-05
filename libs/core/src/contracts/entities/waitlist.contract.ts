// libs/core/src/contracts/entities/waitlist.contract.ts

/**
 * A waitlist entry returned by the API.
 */
export type WaitlistContract = {
  id: string
  email: string
  createdAt: string
}

/**
 * Data required to join the waitlist.
 */
export type JoinWaitlistContract = {
  email: string
}
