/** Records the first successful Discord gateway ready event. */
import { Events, Listener } from '@sapphire/framework';
import type { Client } from 'discord.js';

import { createDiscordMetricsAdapter } from '../../observability/metrics.adapter';
import { withDiscordTrace } from '../../observability/traces.adapter';

// A single adapter instance owns the ready-state gauges for this process.
const metrics = createDiscordMetricsAdapter();

/** Logs and records the Discord client's initial ready state. */
export class ReadyListener extends Listener<typeof Events.ClientReady> {
  public constructor(context: Listener.LoaderContext) {
    // Ready can recur after reconnects; startup state is logged once to avoid
    // duplicate process-ready telemetry.
    super(context, { event: Events.ClientReady, once: true });
  }

  public run(client: Client<true>): void {
    // Non-sharded clients do not expose a shard manager, but logically operate
    // as shard zero for consistent logs and metrics.
    const shardIds = client.shard?.ids ?? [0];
    const gatewayLatencyMs = normalizeLatency(client.ws.ping);

    withDiscordTrace(
      'client.ready',
      () => {
        // Gauges describe current process state and intentionally carry no
        // guild/user labels, which prevents high-cardinality metric series.
        metrics.setBotReady(true);
        metrics.setGuildCount(client.guilds.cache.size);
        metrics.setGatewayLatency(gatewayLatencyMs);

        this.container.logger.info(
          {
            botUsername: client.user.username,
            botUserId: client.user.id,
            guildCount: client.guilds.cache.size,
            shardIds,
            shardCount: shardIds.length,
            gatewayLatencyMs,
          },
          'Discord bot is ready.',
        );
      },
      {
        // Trace attributes are bounded operational numbers, not user payloads.
        'guild.count': client.guilds.cache.size,
        'shard.count': shardIds.length,
        'gateway.latency_ms': gatewayLatencyMs,
      },
    );
  }
}

function normalizeLatency(value: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}
