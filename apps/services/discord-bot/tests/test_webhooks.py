"""Signed webhook verification, limits, and deduplication tests."""

from __future__ import annotations

import time

import pytest
from pydantic import SecretStr

from discord_bot.core.config import WebhookSettings
from discord_bot.utils.health import HealthRegistry
from discord_bot.webhooks.dispatcher import WebhookDispatcher
from discord_bot.webhooks.security import (
    WebhookVerificationError,
    WebhookVerifier,
    sign_webhook,
)
from discord_bot.webhooks.server import WEBHOOK_PATH, WebhookApplication


def webhook_settings(*, maximum_body_bytes: int = 1_024) -> WebhookSettings:
    return WebhookSettings(
        enabled=True,
        signing_secret=SecretStr("webhook-secret"),
        maximum_body_bytes=maximum_body_bytes,
    )


def signed_headers(body: bytes, timestamp: int, delivery_id: str) -> dict[str, str]:
    return {
        "X-Aerealith-Signature": sign_webhook(
            "webhook-secret",
            timestamp,
            body,
        ),
        "X-Aerealith-Timestamp": str(timestamp),
        "X-Aerealith-Event": "guild.config.updated",
        "X-Aerealith-Delivery-ID": delivery_id,
    }


@pytest.mark.asyncio
async def test_valid_signature_dispatches_and_duplicate_is_ignored(logger) -> None:
    dispatcher = WebhookDispatcher(logger)
    deliveries: list[str] = []

    async def handler(event) -> None:
        deliveries.append(event.delivery_id)

    dispatcher.register("guild.config.updated", handler)
    application = WebhookApplication(
        webhook_settings(),
        dispatcher,
        HealthRegistry(),
        logger,
    )
    body = b'{"payload":{"guild_id":123}}'
    timestamp = int(time.time())
    headers = signed_headers(body, timestamp, "delivery-1")

    first = await application.handle("POST", WEBHOOK_PATH, headers, body)
    second = await application.handle("POST", WEBHOOK_PATH, headers, body)

    assert first.status == 202
    assert second.status == 200
    assert deliveries == ["delivery-1"]


@pytest.mark.asyncio
async def test_invalid_signature_is_rejected_before_dispatch(logger) -> None:
    application = WebhookApplication(
        webhook_settings(),
        WebhookDispatcher(logger),
        HealthRegistry(),
        logger,
    )
    body = b"not-even-json"
    headers = signed_headers(body, int(time.time()), "delivery-2")
    headers["X-Aerealith-Signature"] = "sha256=" + "0" * 64
    response = await application.handle("POST", WEBHOOK_PATH, headers, body)
    assert response.status == 401


def test_expired_timestamp_is_rejected() -> None:
    verifier = WebhookVerifier(
        "secret",
        tolerance_seconds=30,
        clock=lambda: 1_000,
    )
    body = b"{}"
    with pytest.raises(WebhookVerificationError, match="outside tolerance"):
        verifier.verify(
            body,
            signature=sign_webhook("secret", 900, body),
            timestamp="900",
        )


@pytest.mark.asyncio
async def test_body_limit_is_enforced(logger) -> None:
    application = WebhookApplication(
        webhook_settings(maximum_body_bytes=4),
        WebhookDispatcher(logger),
        HealthRegistry(),
        logger,
    )
    response = await application.handle("POST", WEBHOOK_PATH, {}, b"12345")
    assert response.status == 413
