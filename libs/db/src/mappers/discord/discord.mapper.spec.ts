import { describe, expect, it } from 'vitest';
import {
  toDiscordAccountInsert,
  toDiscordChannelInsert,
  toDiscordGuildInsert,
  toDiscordRoleInsert,
} from './index';

describe('Discord transport mappers', () => {
  it('maps an unlinked Discord account without inventing a canonical user', () => {
    const row = toDiscordAccountInsert({
      id: '12345678901234567890',
      username: 'example',
      publicFlags: 1n,
    });
    expect(row.discordUserId).toBe('12345678901234567890');
    expect(row.userAccountId).toBeUndefined();
    expect(row.publicFlags).toBe('1');
  });
  it('preserves unknown guild features and derives common capabilities', () => {
    const row = toDiscordGuildInsert({
      id: '200000000000000001',
      ownerId: '100000000000000001',
      name: 'Guild',
      features: ['COMMUNITY', 'FUTURE_DISCORD_FEATURE'],
    });
    expect(row.isCommunity).toBe(true);
    expect(row.discordFeatures).toContain('FUTURE_DISCORD_FEATURE');
  });
  it('keeps permission bitfields and resource IDs lossless', () => {
    const role = toDiscordRoleInsert('guild-id', {
      id: '400000000000000001',
      name: 'Admin',
      permissions: 9223372036854775807n,
    });
    const channel = toDiscordChannelInsert('guild-id', {
      id: '300000000000000001',
      type: 0,
      lastMessageId: '500000000000000001',
    });
    expect(role.permissions).toBe('9223372036854775807');
    expect(channel.lastMessageDiscordId).toBe('500000000000000001');
  });
});
