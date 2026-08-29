import { Command } from '@sapphire/framework';

import { createCommandObserver } from '../../../observability/command-observer';

const commandObserver = createCommandObserver();

export class PingCommand extends Command {
  public constructor(context: Command.LoaderContext) {
    super(context, {
      description: 'Check the Discord bot latency and availability.',
    });
  }

  public override registerApplicationCommands(
    registry: Command.Registry,
  ): void {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('ping')
        .setDescription('Check the Discord bot latency and availability.'),
    );
  }

  public override chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ): Promise<unknown> {
    this.container.logger.debug(
      { command: 'ping', type: 'chat-input' },
      'Executing the ping command.',
    );

    return commandObserver.observe(
      {
        name: 'ping',
        type: 'chat-input',
        shardId: interaction.guild?.shardId,
      },
      async () => {
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
  return Number.isFinite(value) && value >= 0
    ? `${Math.round(value)} ms`
    : 'unavailable';
}
