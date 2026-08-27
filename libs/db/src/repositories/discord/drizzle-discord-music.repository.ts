import { eq } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  getCurrentDiscordMusicSession,
  getDiscordMusicHistory,
  getDiscordMusicPlaylists,
  getDiscordPopularMusic,
  getDiscordUserMusicHistory,
  getRecentDiscordMusicSessions,
} from '../../queries/discord';
import {
  discordMusicPlaylistsTable,
  discordMusicSessionsTable,
  discordMusicTracksTable,
} from '../../schema';

export class DrizzleDiscordMusicRepository {
  constructor(private readonly database: DatabaseClient) {}
  getCurrentSession(guildId: string) {
    return getCurrentDiscordMusicSession(this.database, guildId);
  }
  getRecentSessions(guildId: string, limit?: number) {
    return getRecentDiscordMusicSessions(this.database, guildId, limit);
  }
  getGuildHistory(guildId: string, limit?: number) {
    return getDiscordMusicHistory(this.database, guildId, limit);
  }
  getUserHistory(accountId: string, limit?: number) {
    return getDiscordUserMusicHistory(this.database, accountId, limit);
  }
  getPopular(guildId: string, since: Date, limit?: number) {
    return getDiscordPopularMusic(this.database, guildId, since, limit);
  }
  getPlaylists(ownerAccountId: string) {
    return getDiscordMusicPlaylists(this.database, ownerAccountId);
  }
  async startSession(input: typeof discordMusicSessionsTable.$inferInsert) {
    const [row] = await this.database
      .insert(discordMusicSessionsTable)
      .values(input)
      .returning();
    if (!row) throw new Error('Failed to start Discord music session.');
    return row;
  }
  async endSession(
    id: string,
    input: Pick<
      typeof discordMusicSessionsTable.$inferInsert,
      'endedAt' | 'durationSeconds' | 'trackCount' | 'uniqueListenerCount'
    >,
  ) {
    const [row] = await this.database
      .update(discordMusicSessionsTable)
      .set(input)
      .where(eq(discordMusicSessionsTable.id, id))
      .returning();
    return row ?? null;
  }
  async addTrack(input: typeof discordMusicTracksTable.$inferInsert) {
    const [row] = await this.database
      .insert(discordMusicTracksTable)
      .values(input)
      .returning();
    if (!row) throw new Error('Failed to add Discord music track.');
    return row;
  }
  async savePlaylist(input: typeof discordMusicPlaylistsTable.$inferInsert) {
    const [row] = await this.database
      .insert(discordMusicPlaylistsTable)
      .values(input)
      .returning();
    if (!row) throw new Error('Failed to save Discord playlist.');
    return row;
  }
}
