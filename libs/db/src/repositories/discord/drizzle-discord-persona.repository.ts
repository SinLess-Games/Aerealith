import { and, eq, isNull } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  getDiscordPersonaById,
  getDiscordPersonaGuildSettings,
  getDiscordPersonaProxyPatterns,
  getDiscordPersonasByOwner,
  getDiscordProxiedMessage,
} from '../../queries/discord';
import {
  discordPersonaGuildSettingsTable,
  discordPersonaProxyPatternsTable,
  discordPersonasTable,
  discordProxiedMessagesTable,
} from '../../schema';

export class DrizzleDiscordPersonaRepository {
  constructor(private readonly database: DatabaseClient) {}
  findById(id: string) {
    return getDiscordPersonaById(this.database, id);
  }
  findByOwner(ownerAccountId: string) {
    return getDiscordPersonasByOwner(this.database, ownerAccountId);
  }
  getActivePatterns(ownerAccountId: string) {
    return getDiscordPersonaProxyPatterns(this.database, ownerAccountId);
  }
  getGuildSettings(personaId: string, guildId: string) {
    return getDiscordPersonaGuildSettings(this.database, personaId, guildId);
  }
  resolveProxiedMessage(discordMessageId: string) {
    return getDiscordProxiedMessage(this.database, discordMessageId);
  }
  async create(input: typeof discordPersonasTable.$inferInsert) {
    const [row] = await this.database
      .insert(discordPersonasTable)
      .values(input)
      .returning();
    if (!row) throw new Error('Failed to create Discord persona.');
    return row;
  }
  async update(
    id: string,
    input: Partial<typeof discordPersonasTable.$inferInsert>,
  ) {
    const [row] = await this.database
      .update(discordPersonasTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(discordPersonasTable.id, id))
      .returning();
    return row ?? null;
  }
  async addPattern(
    input: typeof discordPersonaProxyPatternsTable.$inferInsert,
  ) {
    const [row] = await this.database
      .insert(discordPersonaProxyPatternsTable)
      .values(input)
      .returning();
    if (!row) throw new Error('Failed to add Discord persona proxy pattern.');
    return row;
  }
  async setGuildSettings(
    personaId: string,
    guildId: string,
    input: Partial<typeof discordPersonaGuildSettingsTable.$inferInsert>,
  ) {
    const [row] = await this.database
      .insert(discordPersonaGuildSettingsTable)
      .values({ ...input, personaId, guildId })
      .onConflictDoUpdate({
        target: [
          discordPersonaGuildSettingsTable.personaId,
          discordPersonaGuildSettingsTable.guildId,
        ],
        set: { ...input, updatedAt: new Date() },
      })
      .returning();
    if (!row)
      throw new Error('Failed to update Discord persona guild settings.');
    return row;
  }
  async storeProxyMapping(
    input: typeof discordProxiedMessagesTable.$inferInsert,
  ) {
    const [row] = await this.database
      .insert(discordProxiedMessagesTable)
      .values(input)
      .onConflictDoUpdate({
        target: discordProxiedMessagesTable.resultingDiscordMessageId,
        set: input,
      })
      .returning();
    if (!row) throw new Error('Failed to store Discord proxied message.');
    return row;
  }
  async deleteProxyMapping(discordMessageId: string, deletedAt = new Date()) {
    const [row] = await this.database
      .update(discordProxiedMessagesTable)
      .set({ deletedAt })
      .where(
        and(
          eq(
            discordProxiedMessagesTable.resultingDiscordMessageId,
            discordMessageId,
          ),
          isNull(discordProxiedMessagesTable.deletedAt),
        ),
      )
      .returning();
    return row ?? null;
  }
}
