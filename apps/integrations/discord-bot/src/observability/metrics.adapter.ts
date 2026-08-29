import {
  createCounter,
  createGauge,
  createHistogram,
  incrementCounter,
  observeHistogram,
  setGauge,
} from '@aerealith-ai/observability';

export type ObservationOutcome = 'success' | 'failure';

export interface DiscordMetricsAdapter {
  setBotReady(ready: boolean): void;
  setGuildCount(count: number): void;
  setGatewayLatency(durationMs: number): void;
  recordCommand(
    command: string,
    type: string,
    outcome: ObservationOutcome,
    durationMs: number,
  ): void;
  recordGatewayEvent(
    event: string,
    outcome: ObservationOutcome,
    durationMs: number,
  ): void;
  recordShardEvent(event: string, shardId: number): void;
  setShardConnected(shardId: number, connected: boolean): void;
  recordLavalinkEvent(
    event: string,
    outcome: ObservationOutcome,
    node?: string,
  ): void;
  setLavalinkNodeConnected(node: string, connected: boolean): void;
}

/** Creates the bounded, Discord-specific metrics used by the bot observers. */
export function createDiscordMetricsAdapter(
  prefix = 'aerealith_discord_',
): DiscordMetricsAdapter {
  const metricPrefix = normalizePrefix(prefix);
  const botReady = createGauge({
    name: `${metricPrefix}ready`,
    help: 'Whether the Discord bot is ready.',
  });
  const guildCount = createGauge({
    name: `${metricPrefix}guilds`,
    help: 'Number of guilds visible to the Discord bot.',
  });
  const gatewayLatency = createGauge({
    name: `${metricPrefix}gateway_latency_seconds`,
    help: 'Discord gateway heartbeat latency in seconds.',
  });
  const commandTotal = createCounter({
    name: `${metricPrefix}commands_total`,
    help: 'Discord command executions by command, type, and outcome.',
    labelNames: ['command', 'type', 'outcome'],
  });
  const commandDuration = createHistogram({
    name: `${metricPrefix}command_duration_seconds`,
    help: 'Discord command execution duration in seconds.',
    labelNames: ['command', 'type', 'outcome'],
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  });
  const gatewayEventTotal = createCounter({
    name: `${metricPrefix}gateway_events_total`,
    help: 'Discord gateway events by event name and outcome.',
    labelNames: ['event', 'outcome'],
  });
  const gatewayEventDuration = createHistogram({
    name: `${metricPrefix}gateway_event_duration_seconds`,
    help: 'Discord gateway event handling duration in seconds.',
    labelNames: ['event', 'outcome'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  });
  const shardEventTotal = createCounter({
    name: `${metricPrefix}shard_events_total`,
    help: 'Discord shard lifecycle events by event and shard.',
    labelNames: ['event', 'shard'],
  });
  const shardConnected = createGauge({
    name: `${metricPrefix}shard_connected`,
    help: 'Whether a Discord shard is connected.',
    labelNames: ['shard'],
  });
  const lavalinkEventTotal = createCounter({
    name: `${metricPrefix}lavalink_events_total`,
    help: 'Lavalink lifecycle events by event, node, and outcome.',
    labelNames: ['event', 'node', 'outcome'],
  });
  const lavalinkNodeConnected = createGauge({
    name: `${metricPrefix}lavalink_node_connected`,
    help: 'Whether a configured Lavalink node is connected.',
    labelNames: ['node'],
  });

  return {
    setBotReady(ready) {
      setGauge(botReady, ready ? 1 : 0);
    },
    setGuildCount(count) {
      setGauge(guildCount, normalizeCount(count));
    },
    setGatewayLatency(durationMs) {
      setGauge(gatewayLatency, normalizeDuration(durationMs) / 1_000);
    },
    recordCommand(command, type, outcome, durationMs) {
      const labels = {
        command: normalizeLabel(command),
        type: normalizeLabel(type),
        outcome,
      };
      incrementCounter(commandTotal, labels);
      observeHistogram(
        commandDuration,
        normalizeDuration(durationMs) / 1_000,
        labels,
      );
    },
    recordGatewayEvent(event, outcome, durationMs) {
      const labels = { event: normalizeLabel(event), outcome };
      incrementCounter(gatewayEventTotal, labels);
      observeHistogram(
        gatewayEventDuration,
        normalizeDuration(durationMs) / 1_000,
        labels,
      );
    },
    recordShardEvent(event, shardId) {
      incrementCounter(shardEventTotal, {
        event: normalizeLabel(event),
        shard: normalizeShardId(shardId),
      });
    },
    setShardConnected(shardId, connected) {
      setGauge(shardConnected, connected ? 1 : 0, {
        shard: normalizeShardId(shardId),
      });
    },
    recordLavalinkEvent(event, outcome, node = 'unknown') {
      incrementCounter(lavalinkEventTotal, {
        event: normalizeLabel(event),
        node: normalizeLabel(node),
        outcome,
      });
    },
    setLavalinkNodeConnected(node, connected) {
      setGauge(lavalinkNodeConnected, connected ? 1 : 0, {
        node: normalizeLabel(node),
      });
    },
  };
}

function normalizePrefix(prefix: string): string {
  const normalized = prefix.trim();
  if (!/^[a-zA-Z_:][a-zA-Z0-9_:]*_?$/u.test(normalized)) {
    throw new Error('Discord metrics prefix is invalid.');
  }
  return normalized.endsWith('_') ? normalized : `${normalized}_`;
}

function normalizeLabel(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/gu, '_')
    .slice(0, 64);
  return normalized || 'unknown';
}

function normalizeShardId(shardId: number): string {
  return Number.isInteger(shardId) && shardId >= 0
    ? String(shardId)
    : 'unknown';
}

function normalizeDuration(durationMs: number): number {
  return Number.isFinite(durationMs) && durationMs >= 0 ? durationMs : 0;
}

function normalizeCount(count: number): number {
  return Number.isInteger(count) && count >= 0 ? count : 0;
}
