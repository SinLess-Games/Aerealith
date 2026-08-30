/** Verifies Discord metric normalization and Prometheus exposition. */
import {
  getMetrics,
  resetMetricsForTesting,
} from '@aerealith-ai/observability';

import { createDiscordMetricsAdapter } from './metrics.adapter';

describe('Discord metrics adapter', () => {
  afterEach(() => {
    // The observability library owns one process registry, so each test clears
    // its instruments to remain independent from import and execution order.
    resetMetricsForTesting();
  });

  it('records normalized Discord state and command measurements', async () => {
    const metrics = createDiscordMetricsAdapter('test_discord');

    metrics.setBotReady(true);
    metrics.setGuildCount(3);
    metrics.setGatewayLatency(125);
    metrics.recordCommand('Play Song', 'Chat Input', 'success', 250);
    metrics.recordShardEvent('Shard Ready', 2);
    metrics.setShardConnected(2, true);
    metrics.recordLavalinkEvent('Node Ready', 'success', 'Primary Node');
    metrics.setLavalinkNodeConnected('Primary Node', true);

    const output = await getMetrics();

    expect(output).toContain('test_discord_ready 1');
    expect(output).toContain('test_discord_guilds 3');
    expect(output).toContain('test_discord_gateway_latency_seconds 0.125');
    expect(output).toContain(
      'test_discord_commands_total{command="play_song",type="chat_input",outcome="success"} 1',
    );
    expect(output).toContain(
      'test_discord_command_duration_seconds_sum{command="play_song",type="chat_input",outcome="success"} 0.25',
    );
    expect(output).toContain(
      'test_discord_shard_events_total{event="shard_ready",shard="2"} 1',
    );
    expect(output).toContain(
      'test_discord_lavalink_node_connected{node="primary_node"} 1',
    );
  });

  it('clamps invalid numeric values into stable metric series', async () => {
    const metrics = createDiscordMetricsAdapter('test_discord_');

    metrics.setGuildCount(-1);
    metrics.setGatewayLatency(Number.NaN);
    metrics.setShardConnected(-1, false);

    const output = await getMetrics();

    expect(output).toContain('test_discord_guilds 0');
    expect(output).toContain('test_discord_gateway_latency_seconds 0');
    expect(output).toContain('test_discord_shard_connected{shard="unknown"} 0');
  });

  it('rejects an invalid Prometheus prefix before registering metrics', () => {
    expect(() => createDiscordMetricsAdapter('invalid prefix')).toThrow(
      'Discord metrics prefix is invalid.',
    );
  });
});
