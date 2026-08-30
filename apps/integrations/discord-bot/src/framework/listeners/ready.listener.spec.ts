/** Verifies the first-ready listener's structured startup record. */
import type { Client } from 'discord.js';

import { ReadyListener } from './ready.listener';

function createListener(logger: { info: jest.Mock }): ReadyListener {
  // Sapphire normally constructs pieces through its loader; a prototype
  // instance isolates the listener callback from framework bootstrapping.
  const listener = Object.create(ReadyListener.prototype) as ReadyListener;
  Object.defineProperty(listener, 'container', {
    value: { logger },
    configurable: true,
  });
  return listener;
}

describe('Ready listener', () => {
  it('logs bounded bot, guild, shard, and latency state', () => {
    const logger = { info: jest.fn() };
    const listener = createListener(logger);
    const client = {
      shard: { ids: [0, 1] },
      ws: { ping: 41.6 },
      guilds: { cache: { size: 12 } },
      user: { username: 'Aerealith', id: '123456789012345678' },
    } as unknown as Client<true>;

    listener.run(client);

    expect(logger.info).toHaveBeenCalledWith(
      {
        botUsername: 'Aerealith',
        botUserId: '123456789012345678',
        guildCount: 12,
        shardIds: [0, 1],
        shardCount: 2,
        gatewayLatencyMs: 42,
      },
      'Discord bot is ready.',
    );
  });

  it('normalizes missing shard and unavailable latency state', () => {
    const logger = { info: jest.fn() };
    const listener = createListener(logger);
    const client = {
      ws: { ping: Number.NaN },
      guilds: { cache: { size: 0 } },
      user: { username: 'Aerealith', id: '123456789012345678' },
    } as unknown as Client<true>;

    listener.run(client);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        shardIds: [0],
        shardCount: 1,
        gatewayLatencyMs: 0,
      }),
      'Discord bot is ready.',
    );
  });
});
