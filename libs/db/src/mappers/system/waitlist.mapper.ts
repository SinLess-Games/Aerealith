// libs/db/src/mappers/system/waitlist.mapper.ts

import {
  WaitlistEntity,
  type JoinWaitlistContract,
  type WaitlistContract,
} from '@aerealith-ai/core';

import type {
  NewWaitlistRow,
  WaitlistRow,
} from '../../schema';

/**
 * Converts a database waitlist row into the core waitlist entity.
 */
export function toWaitlistEntity(row: WaitlistRow): WaitlistEntity {
  return new WaitlistEntity({
    id: row.id,
    email: row.email,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  });
}

/**
 * Converts a core waitlist entity into the API-safe waitlist contract.
 */
export function toWaitlistContract(
  entity: WaitlistEntity,
): WaitlistContract {
  return {
    id: entity.id,
    email: entity.email,
    createdAt: entity.createdAt.toISOString(),
  };
}

/**
 * Converts validated waitlist input into a new database row.
 *
 * Database-generated values such as id and timestamps are omitted.
 */
export function toNewWaitlistRow(
  input: JoinWaitlistContract,
): NewWaitlistRow {
  return {
    email: input.email.trim().toLowerCase(),
  };
}
