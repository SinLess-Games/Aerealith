import { bootstrapDiscordBot } from './bootstrap/bootstrap';
import { discordLogger } from './observability/logger.adapter';

void bootstrapDiscordBot().catch((error: unknown) => {
  discordLogger.fatal(error, 'The Discord bot failed to start.');
  process.exitCode = 1;
});
