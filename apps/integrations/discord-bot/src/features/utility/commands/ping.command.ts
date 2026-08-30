/** Implements the lightweight `/ping` availability and latency command. */
import { Command } from '@sapphire/framework';

import { createCommandObserver } from '../../../observability/command-observer';

// Reuse one observer so the command's metric instruments are registered once.
const commandObserver = createCommandObserver();

/** Sapphire command piece discovered from the explicitly registered store path. */
export class PingCommand extends Command {
  public constructor(context: Command.LoaderContext) {
    super(context, {
      description: 'Check the Discord bot latency and availability.',
    });
  }

  public override registerApplicationCommands(
    registry: Command.Registry,
  ): void {
    // Sapphire owns REST synchronization and automatically chooses the
    // development guild or global scope configured by the client factory.
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('ping')
        .setDescription('Check the Discord bot latency and availability.'),
    );
  }

  public override chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ): Promise<unknown> {
    // Framework logging uses the adapter installed on SapphireClient, keeping
    // the command independent from Pino or any exporter implementation.
    this.container.logger.debug(
      { command: 'ping', type: 'chat-input' },
      'Executing the ping command.',
    );

    // The observer wraps execution with context, tracing, duration metrics,
    // structured outcome logs, and Sentry capture on failure.
    return commandObserver.observe(
      {
        name: 'ping',
        type: 'chat-input',
        shardId: interaction.guild?.shardId,
      },
      async () => {
        // WebSocket latency is Discord's latest heartbeat measurement. Round
        // trip latency measures time since Discord created this interaction.
        const gatewayLatency = formatLatency(interaction.client.ws.ping);
        const roundTripLatency = Math.max(
          0,
          Date.now() - interaction.createdTimestamp,
        );

        return interaction.reply({
          content: `🏓 Pong!\nGateway: ${gatewayLatency}\nRound trip: ${roundTripLatency} ms`,
          ephemeral: true,
        });
      },
    );
  }
}

function formatLatency(value: number): string {
  // Discord can report an unavailable/negative ping before the first heartbeat.
  return Number.isFinite(value) && value >= 0
    ? `${Math.round(value)} ms`
    : 'unavailable';
}
