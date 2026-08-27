"""Shared settings and logger fixtures for isolated framework tests."""

from __future__ import annotations

from collections.abc import Callable

import pytest
from pydantic import SecretStr

from discord_bot.core.config import (
    APISettings,
    DiscordSettings,
    Environment,
    LavalinkSettings,
    OAuthSettings,
    PresenceSettings,
    Settings,
    WebhookSettings,
)
from discord_bot.utils.logger import Logger


def build_settings(**updates: object) -> Settings:
    values: dict[str, object] = {
        "environment": Environment.TEST,
        "discord": DiscordSettings(
            token=SecretStr("test-discord-token"),
            application_id=123456789,
            public_key="ab" * 32,
            sync_commands_on_startup=False,
        ),
        "api": APISettings.model_validate({"base_url": "https://api.example.test"}),
        "oauth": OAuthSettings.model_validate(
            {
                "token_url": "https://auth.example.test/oauth/token",
                "client_id": "discord-bot",
                "client_secret": SecretStr("test-client-secret"),
                "token_refresh_leeway_seconds": 10,
            }
        ),
        "webhook": WebhookSettings(enabled=False),
        "lavalink": LavalinkSettings(enabled=False),
        "presence": PresenceSettings(enabled=False),
    }
    values.update(updates)
    return Settings.model_validate(values)


@pytest.fixture
def settings_factory() -> Callable[..., Settings]:
    return build_settings


@pytest.fixture
def logger() -> Logger:
    return Logger(level="critical", environment="test")
