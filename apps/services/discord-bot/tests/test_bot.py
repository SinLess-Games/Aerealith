"""Sharded bot, intent, and extension wiring tests."""

from __future__ import annotations

import pytest
from disnake.ext import commands

from discord_bot.core.bot import AerealithBot
from discord_bot.core.dependencies import ApplicationDependencies


@pytest.mark.asyncio
async def test_bot_supports_both_command_frameworks_and_required_intents(
    settings_factory,
    logger,
) -> None:
    dependencies = ApplicationDependencies.create(settings_factory(), logger)
    bot = AerealithBot(dependencies)
    dependencies.bind_bot(bot)
    bot.load_framework_extensions()
    try:
        assert isinstance(bot, commands.AutoShardedBot)
        assert bot.get_command("ping") is not None
        assert bot.get_slash_command("ping") is not None
        assert bot.intents.guilds
        assert bot.intents.members
        assert bot.intents.message_content
        assert bot.intents.voice_states
    finally:
        await bot.close()
        await dependencies.close()
