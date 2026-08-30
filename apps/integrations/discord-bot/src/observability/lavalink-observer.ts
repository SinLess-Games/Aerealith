/** Translates Lavalink lifecycle callbacks into shared Discord telemetry. */
import {
  captureException,
  logger as defaultLogger,
  type ObservabilityLogger,
} from '@aerealith-ai/observability';

import {
  createDiscordMetricsAdapter,
  type DiscordMetricsAdapter,
  type ObservationOutcome,
} from './metrics.adapter';
import { withDiscordTrace } from './traces.adapter';

/** Small callback-oriented API consumed by an eventual Lavalink integration. */
export interface LavalinkObserver {
  connected(node: string): void;
  reconnecting(node: string): void;
  disconnected(node: string, code?: number): void;
  error(node: string, error: unknown): void;
  trackStarted(node?: string): void;
  trackEnded(reason: string, node?: string): void;
  trackFailed(error: unknown, node?: string): void;
}

/** Optional collaborators allow reuse with a child logger or test metrics. */
export interface LavalinkObserverOptions {
  readonly logger?: ObservabilityLogger;
  readonly metrics?: DiscordMetricsAdapter;
}

/** Observes Lavalink lifecycle events without logging track or request data. */
export function createLavalinkObserver(
  options: LavalinkObserverOptions = {},
): LavalinkObserver {
  const logger = options.logger ?? defaultLogger;
  const metrics = options.metrics ?? createDiscordMetricsAdapter();

  const observe = (
    event: string,
    outcome: ObservationOutcome,
    node: string | undefined,
    log: () => void,
  ): void => {
    // All node events share consistent trace naming and metric dimensions.
    withDiscordTrace(
      `lavalink.${event}`,
      () => {
        metrics.recordLavalinkEvent(event, outcome, node);
        log();
      },
      { 'lavalink.event': event, 'lavalink.node': node ?? 'unknown' },
    );
  };

  return {
    connected(node) {
      // Connection state is a gauge; the event counter separately preserves
      // how often state transitions occur.
      metrics.setLavalinkNodeConnected(node, true);
      observe('connected', 'success', node, () =>
        logger.info({
          event: 'discord.lavalink.connected',
          message: 'Lavalink node connected.',
          component: 'discord-lavalink',
          context: { node },
        }),
      );
    },
    reconnecting(node) {
      metrics.setLavalinkNodeConnected(node, false);
      observe('reconnecting', 'success', node, () =>
        logger.warn({
          event: 'discord.lavalink.reconnecting',
          message: 'Lavalink node is reconnecting.',
          component: 'discord-lavalink',
          context: { node },
        }),
      );
    },
    disconnected(node, code) {
      metrics.setLavalinkNodeConnected(node, false);
      observe('disconnected', 'failure', node, () =>
        logger.warn({
          event: 'discord.lavalink.disconnected',
          message: 'Lavalink node disconnected.',
          component: 'discord-lavalink',
          context: { node, code },
        }),
      );
    },
    error(node, error) {
      // Capture before logging so both reporting paths see the original error.
      captureException(error, {
        component: 'discord-lavalink',
        operation: 'node-error',
        node,
      });
      observe('error', 'failure', node, () =>
        logger.error({
          event: 'discord.lavalink.error',
          message: 'Lavalink node emitted an error.',
          component: 'discord-lavalink',
          error,
          context: { node },
        }),
      );
    },
    trackStarted(node) {
      // Track metadata is intentionally absent to avoid logging user requests,
      // titles, URLs, or other high-cardinality media data.
      observe('track_started', 'success', node, () =>
        logger.debug({
          event: 'discord.lavalink.track.started',
          message: 'Lavalink track started.',
          component: 'discord-lavalink',
          context: { node },
        }),
      );
    },
    trackEnded(reason, node) {
      observe('track_ended', 'success', node, () =>
        logger.debug({
          event: 'discord.lavalink.track.ended',
          message: 'Lavalink track ended.',
          component: 'discord-lavalink',
          context: { node, reason },
        }),
      );
    },
    trackFailed(error, node) {
      // Only stable node/operation context accompanies the exception.
      captureException(error, {
        component: 'discord-lavalink',
        operation: 'track-failed',
        node,
      });
      observe('track_failed', 'failure', node, () =>
        logger.error({
          event: 'discord.lavalink.track.failed',
          message: 'Lavalink track failed.',
          component: 'discord-lavalink',
          error,
          context: { node },
        }),
      );
    },
  };
}
