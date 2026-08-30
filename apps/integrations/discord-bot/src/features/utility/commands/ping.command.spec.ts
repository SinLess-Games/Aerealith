/** Verifies the public behavior and registration of the `/ping` command. */
import { Command } from '@sapphire/framework';
import { SlashCommandBuilder } from 'discord.js';

import { PingCommand } from './ping.command';

function createCommand(logger: { debug: jest.Mock }): PingCommand {
  // Command construction normally requires Sapphire's piece loader. Creating a
  // prototype instance keeps this unit test focused on the command behavior.
  const command = Object.create(PingCommand.prototype) as PingCommand;
  Object.defineProperty(command, 'container', {
    value: { logger },
    configurable: true,
  });
  return command;
}

describe('/ping command', () => {
  it('registers its slash command definition', () => {
    const command = createCommand({ debug: jest.fn() });
    const registerChatInputCommand = jest.fn(
      (configure: (builder: SlashCommandBuilder) => SlashCommandBuilder) =>
        configure(new SlashCommandBuilder()),
    );

    command.registerApplicationCommands({
      registerChatInputCommand,
    } as unknown as Command.Registry);

    const definition = registerChatInputCommand.mock.results[0]?.value.toJSON();
    expect(definition).toMatchObject({
      name: 'ping',
      description: 'Check the Discord bot latency and availability.',
    });
  });

  it('replies ephemerally with gateway and round-trip latency', async () => {
    const logger = { debug: jest.fn() };
    const command = createCommand(logger);
    const reply = jest.fn().mockResolvedValue('sent');
    const interaction = {
      client: { ws: { ping: 42.4 } },
      createdTimestamp: Date.now() - 25,
      guild: { shardId: 2 },
      reply,
    } as unknown as Command.ChatInputCommandInteraction;

    await expect(command.chatInputRun(interaction)).resolves.toBe('sent');

    expect(reply).toHaveBeenCalledWith({
      content: expect.stringMatching(
        /^🏓 Pong!\nGateway: 42 ms\nRound trip: \d+ ms$/u,
      ),
      ephemeral: true,
    });
    expect(logger.debug).toHaveBeenCalledWith(
      { command: 'ping', type: 'chat-input' },
      'Executing the ping command.',
    );
  });

  it('reports unavailable gateway latency before the first heartbeat', async () => {
    const command = createCommand({ debug: jest.fn() });
    const reply = jest.fn().mockResolvedValue(undefined);

    await command.chatInputRun({
      client: { ws: { ping: -1 } },
      createdTimestamp: Date.now(),
      reply,
    } as unknown as Command.ChatInputCommandInteraction);

    expect(reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Gateway: unavailable'),
      }),
    );
  });
});
