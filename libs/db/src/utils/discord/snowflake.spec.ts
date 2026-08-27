import { describe, expect, it } from 'vitest';
import {
  discordSnowflakeCreatedAt,
  isDiscordSnowflake,
  toDiscordSnowflake,
} from './snowflake';

describe('Discord snowflakes', () => {
  it('preserves values above the JavaScript safe integer boundary', () => {
    expect(toDiscordSnowflake('12345678901234567890')).toBe(
      '12345678901234567890',
    );
    expect(toDiscordSnowflake(12345678901234567890n)).toBe(
      '12345678901234567890',
    );
  });
  it('rejects unsafe or malformed representations', () => {
    expect(isDiscordSnowflake(123)).toBe(false);
    expect(() => toDiscordSnowflake('-1')).toThrow(TypeError);
    expect(() => toDiscordSnowflake('1.5')).toThrow(TypeError);
    expect(() => toDiscordSnowflake('123456789012345678901')).toThrow(
      TypeError,
    );
  });
  it('derives the Discord creation timestamp without a number conversion', () => {
    expect(discordSnowflakeCreatedAt('175928847299117063').toISOString()).toBe(
      '2016-04-30T11:18:25.796Z',
    );
  });
});
