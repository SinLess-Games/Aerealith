import { and, eq, isNull, notInArray } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  mapDiscordAutomodRule,
  mapDiscordEmoji,
  mapDiscordScheduledEvent,
  mapDiscordSticker,
  type DiscordAutomodRuleTransport,
  type DiscordEmojiTransport,
  type DiscordScheduledEventTransport,
  type DiscordStickerTransport,
} from '../../mappers/discord';
import {
  discordEmojisTable,
  discordNativeAutomodRulesTable,
  discordScheduledEventsTable,
  discordSoundboardSoundsTable,
  discordStickersTable,
} from '../../schema';

export type DiscordSoundboardTransport = {
  id: string;
  name: string;
  volume?: number;
  emojiId?: string | null;
  emojiName?: string | null;
  available?: boolean;
};
export class DrizzleDiscordResourceRepository {
  constructor(private readonly database: DatabaseClient) {}
  async synchronizeEmojis(
    guildId: string,
    values: readonly DiscordEmojiTransport[],
  ) {
    return this.database.transaction(async (tx) => {
      const rows = [];
      for (const value of values) {
        const mapped = mapDiscordEmoji(guildId, value);
        const [row] = await tx
          .insert(discordEmojisTable)
          .values(mapped)
          .onConflictDoUpdate({
            target: discordEmojisTable.discordEmojiId,
            set: { ...mapped, deletedAt: null },
          })
          .returning();
        if (row) rows.push(row);
      }
      const ids = values.map((value) => value.id);
      await tx
        .update(discordEmojisTable)
        .set({ deletedAt: new Date() })
        .where(
          ids.length
            ? and(
                eq(discordEmojisTable.guildId, guildId),
                isNull(discordEmojisTable.deletedAt),
                notInArray(discordEmojisTable.discordEmojiId, ids),
              )
            : and(
                eq(discordEmojisTable.guildId, guildId),
                isNull(discordEmojisTable.deletedAt),
              ),
        );
      return rows;
    });
  }
  async synchronizeStickers(
    guildId: string,
    values: readonly DiscordStickerTransport[],
  ) {
    return this.database.transaction(async (tx) => {
      const rows = [];
      for (const value of values) {
        const mapped = mapDiscordSticker(guildId, value);
        const [row] = await tx
          .insert(discordStickersTable)
          .values(mapped)
          .onConflictDoUpdate({
            target: discordStickersTable.discordStickerId,
            set: { ...mapped, deletedAt: null },
          })
          .returning();
        if (row) rows.push(row);
      }
      const ids = values.map((value) => value.id);
      await tx
        .update(discordStickersTable)
        .set({ deletedAt: new Date() })
        .where(
          ids.length
            ? and(
                eq(discordStickersTable.guildId, guildId),
                isNull(discordStickersTable.deletedAt),
                notInArray(discordStickersTable.discordStickerId, ids),
              )
            : and(
                eq(discordStickersTable.guildId, guildId),
                isNull(discordStickersTable.deletedAt),
              ),
        );
      return rows;
    });
  }
  async synchronizeSoundboard(
    guildId: string,
    values: readonly DiscordSoundboardTransport[],
  ) {
    return this.database.transaction(async (tx) => {
      const rows = [];
      for (const value of values) {
        const mapped = {
          guildId,
          discordSoundId: value.id,
          name: value.name.trim(),
          volume: String(value.volume ?? 1),
          emojiDiscordId: value.emojiId ?? null,
          emojiName: value.emojiName ?? null,
          available: value.available ?? true,
          deletedAt: null,
        };
        const [row] = await tx
          .insert(discordSoundboardSoundsTable)
          .values(mapped)
          .onConflictDoUpdate({
            target: discordSoundboardSoundsTable.discordSoundId,
            set: { ...mapped, updatedAt: new Date() },
          })
          .returning();
        if (row) rows.push(row);
      }
      const ids = values.map((value) => value.id);
      await tx
        .update(discordSoundboardSoundsTable)
        .set({ deletedAt: new Date() })
        .where(
          ids.length
            ? and(
                eq(discordSoundboardSoundsTable.guildId, guildId),
                isNull(discordSoundboardSoundsTable.deletedAt),
                notInArray(discordSoundboardSoundsTable.discordSoundId, ids),
              )
            : and(
                eq(discordSoundboardSoundsTable.guildId, guildId),
                isNull(discordSoundboardSoundsTable.deletedAt),
              ),
        );
      return rows;
    });
  }
  async synchronizeScheduledEvents(
    guildId: string,
    values: readonly DiscordScheduledEventTransport[],
  ) {
    const rows = [];
    for (const value of values) {
      const mapped = mapDiscordScheduledEvent(guildId, value);
      const [row] = await this.database
        .insert(discordScheduledEventsTable)
        .values(mapped)
        .onConflictDoUpdate({
          target: discordScheduledEventsTable.discordEventId,
          set: { ...mapped, updatedAt: new Date(), deletedAt: null },
        })
        .returning();
      if (row) rows.push(row);
    }
    return rows;
  }
  async synchronizeNativeAutomod(
    guildId: string,
    values: readonly DiscordAutomodRuleTransport[],
  ) {
    const rows = [];
    for (const value of values) {
      const mapped = mapDiscordAutomodRule(guildId, value);
      const [row] = await this.database
        .insert(discordNativeAutomodRulesTable)
        .values(mapped)
        .onConflictDoUpdate({
          target: discordNativeAutomodRulesTable.discordRuleId,
          set: { ...mapped, updatedAt: new Date(), deletedAt: null },
        })
        .returning();
      if (row) rows.push(row);
    }
    return rows;
  }
}
