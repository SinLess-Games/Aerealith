import { and, eq, isNull } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  toDiscordAccountInsert,
  type DiscordUserTransport,
} from '../../mappers/discord';
import {
  getDiscordAccountByCanonicalUserId,
  getDiscordAgeVerificationState,
  getDiscordLinkedCanonicalUser,
  getDiscordUserEntitlements,
  getDiscordUserSettings,
} from '../../queries/discord';
import {
  discordAccountsTable,
  discordUserSettingsTable,
  userAccountsTable,
} from '../../schema';
import { toDiscordSnowflake } from '../../utils/discord';

export class DrizzleDiscordAccountRepository {
  constructor(private readonly database: DatabaseClient) {}
  async findById(id: string) {
    const [row] = await this.database
      .select()
      .from(discordAccountsTable)
      .where(
        and(
          eq(discordAccountsTable.id, id),
          isNull(discordAccountsTable.deletedAt),
        ),
      )
      .limit(1);
    return row ?? null;
  }
  async findByDiscordUserId(discordUserId: string) {
    const [row] = await this.database
      .select()
      .from(discordAccountsTable)
      .where(
        and(
          eq(
            discordAccountsTable.discordUserId,
            toDiscordSnowflake(discordUserId),
          ),
          isNull(discordAccountsTable.deletedAt),
        ),
      )
      .limit(1);
    return row ?? null;
  }
  findByCanonicalUserId(userId: string) {
    return getDiscordAccountByCanonicalUserId(this.database, userId);
  }
  getLinkedCanonicalUser(discordUserId: string) {
    return getDiscordLinkedCanonicalUser(this.database, discordUserId);
  }
  getEntitlements(discordUserId: string) {
    return getDiscordUserEntitlements(this.database, discordUserId);
  }
  getAgeVerification(discordUserId: string) {
    return getDiscordAgeVerificationState(this.database, discordUserId);
  }
  getSettings(discordAccountId: string) {
    return getDiscordUserSettings(this.database, discordAccountId);
  }
  async upsert(user: DiscordUserTransport) {
    const values = toDiscordAccountInsert(user);
    const [row] = await this.database
      .insert(discordAccountsTable)
      .values(values)
      .onConflictDoUpdate({
        target: discordAccountsTable.discordUserId,
        set: {
          ...values,
          firstSeenAt: undefined,
          updatedAt: new Date(),
          deletedAt: null,
        },
      })
      .returning();
    if (!row) throw new Error('Failed to upsert Discord account.');
    return row;
  }
  async linkToCanonicalUser(
    discordAccountId: string,
    canonicalUserId: string,
    displayName: string,
  ) {
    return this.database.transaction(async (tx) => {
      const account = await tx
        .select()
        .from(discordAccountsTable)
        .where(eq(discordAccountsTable.id, discordAccountId))
        .limit(1)
        .then((rows) => rows[0]);
      if (!account) throw new Error('Discord account not found.');
      const [connected] = await tx
        .insert(userAccountsTable)
        .values({
          userId: canonicalUserId,
          provider: 'discord',
          accountId: account.discordUserId,
          displayName: displayName.trim(),
          status: 'active',
          deletedAt: null,
        })
        .onConflictDoUpdate({
          target: [userAccountsTable.provider, userAccountsTable.accountId],
          set: {
            userId: canonicalUserId,
            displayName: displayName.trim(),
            status: 'active',
            deletedAt: null,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!connected)
        throw new Error(
          'Failed to create canonical Discord connected account.',
        );
      const [linked] = await tx
        .update(discordAccountsTable)
        .set({
          userAccountId: connected.id,
          isLinkedActive: true,
          linkedAt: new Date(),
          unlinkedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(discordAccountsTable.id, discordAccountId))
        .returning();
      if (!linked) throw new Error('Failed to link Discord account.');
      return linked;
    });
  }
  async unlink(discordAccountId: string) {
    return this.database.transaction(async (tx) => {
      const [account] = await tx
        .update(discordAccountsTable)
        .set({
          userAccountId: null,
          isLinkedActive: false,
          unlinkedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(discordAccountsTable.id, discordAccountId))
        .returning();
      if (!account) return null;
      await tx
        .update(userAccountsTable)
        .set({
          status: 'revoked',
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userAccountsTable.provider, 'discord'),
            eq(userAccountsTable.accountId, account.discordUserId),
          ),
        );
      return account;
    });
  }
  async updateSettings(
    discordAccountId: string,
    input: Partial<typeof discordUserSettingsTable.$inferInsert>,
  ) {
    const [row] = await this.database
      .insert(discordUserSettingsTable)
      .values({ ...input, discordAccountId })
      .onConflictDoUpdate({
        target: discordUserSettingsTable.discordAccountId,
        set: { ...input, updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error('Failed to update Discord user settings.');
    return row;
  }
}
