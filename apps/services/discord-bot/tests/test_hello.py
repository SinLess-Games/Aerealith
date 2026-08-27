"""Configuration boundary tests replacing the generated placeholder test."""

import pytest
from pydantic import SecretStr, ValidationError

from discord_bot.core.config import (
    APISettings,
    DiscordSettings,
    Environment,
    LavalinkSettings,
    OAuthSettings,
    Settings,
    WebhookSettings,
)


def test_required_root_settings_are_enforced() -> None:
    with pytest.raises(ValidationError):
        Settings()


def test_production_rejects_plain_http_api(settings_factory) -> None:
    with pytest.raises(ValidationError, match="must use HTTPS"):
        settings_factory(
            environment=Environment.PRODUCTION,
            api=APISettings.model_validate({"base_url": "http://api.example.test"}),
        )


def test_enabled_webhook_requires_secret() -> None:
    with pytest.raises(ValidationError, match="signing_secret"):
        WebhookSettings(enabled=True)


def test_enabled_lavalink_requires_password() -> None:
    with pytest.raises(ValidationError, match="password"):
        LavalinkSettings(enabled=True)


def test_shard_ids_require_valid_shard_count() -> None:
    with pytest.raises(ValidationError, match="shard_count"):
        DiscordSettings(
            token=SecretStr("token"),
            application_id=123,
            public_key="ab" * 32,
            shard_ids=(0,),
        )


def test_production_oauth_also_requires_https(settings_factory) -> None:
    with pytest.raises(ValidationError, match="OAuth token endpoint"):
        settings_factory(
            environment=Environment.PRODUCTION,
            oauth=OAuthSettings.model_validate(
                {
                    "token_url": "http://auth.example.test/token",
                    "client_id": "bot",
                    "client_secret": SecretStr("secret"),
                }
            ),
        )
