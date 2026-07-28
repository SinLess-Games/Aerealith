/**
 * Password hashes live on the core user entity and the db `users` row.
 * This value object is useful when passing a replacement hash to an adapter.
 */
export interface PasswordCredential {
  readonly userId: string;
  readonly passwordHash: string;
}
