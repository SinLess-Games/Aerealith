import type { UserEntity } from '@aerealith-ai/core';

/**
 * The authentication subset of `DrizzleUserRepository`.
 *
 * Keeping this as a structural port lets auth depend on core while the db
 * library supplies the concrete adapter.
 */
export interface AuthUserRepository {
  findEntityById(id: string): Promise<UserEntity | null>;
  findEntityByEmail(email: string): Promise<UserEntity | null>;
  findEntityByUsername(username: string): Promise<UserEntity | null>;
  setPasswordHash(id: string, passwordHash: string | null): Promise<boolean>;
}
