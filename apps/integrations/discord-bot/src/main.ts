/**
 * Process entry point for the Discord bot.
 *
 * Keeping this file small makes startup behavior easy to audit: bootstrap owns
 * initialization, while this boundary only converts an unhandled startup
 * failure into a fatal log entry and a failing process exit code.
 */
import { bootstrapDiscordBot } from './bootstrap/bootstrap';
import { discordLogger } from './observability/logger.adapter';

void bootstrapDiscordBot().catch((error: unknown) => {
  // Preserve the original error for structured logging without exposing it to
  // Discord users. Setting exitCode lets pending log/export flushes complete.
  discordLogger.fatal(error, 'The Discord bot failed to start.');
  process.exitCode = 1;
});
