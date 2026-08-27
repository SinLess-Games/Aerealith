"""OAuth client-credentials token lifecycle tests."""

from __future__ import annotations

import asyncio

import httpx
import pytest
from pydantic import SecretStr

from discord_bot.api.auth import OAuthTokenProvider
from discord_bot.api.errors import OAuthTokenError
from discord_bot.core.config import OAuthSettings


def oauth_settings() -> OAuthSettings:
    return OAuthSettings.model_validate(
        {
            "token_url": "https://auth.example.test/token",
            "client_id": "bot",
            "client_secret": SecretStr("client-secret"),
            "scopes": ("discord.bot", "guilds.read"),
            "token_refresh_leeway_seconds": 10,
        }
    )


@pytest.mark.asyncio
async def test_token_acquisition_caching_and_proactive_refresh(logger) -> None:
    now = [0.0]
    calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        assert request.method == "POST"
        return httpx.Response(
            200,
            json={
                "access_token": f"token-{calls}",
                "token_type": "Bearer",
                "expires_in": 100,
            },
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    provider = OAuthTokenProvider(
        oauth_settings(),
        logger,
        client=client,
        clock=lambda: now[0],
    )
    try:
        assert await provider.get_access_token() == "token-1"
        assert await provider.get_access_token() == "token-1"
        assert calls == 1

        now[0] = 91
        assert await provider.get_access_token() == "token-2"
        assert calls == 2
    finally:
        await provider.close()
        await client.aclose()


@pytest.mark.asyncio
async def test_concurrent_refresh_is_coalesced(logger) -> None:
    calls = 0

    async def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        await asyncio.sleep(0)
        return httpx.Response(
            200,
            json={
                "access_token": "shared-token",
                "token_type": "bearer",
                "expires_in": 100,
            },
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    provider = OAuthTokenProvider(oauth_settings(), logger, client=client)
    try:
        tokens = await asyncio.gather(*(provider.get_access_token() for _ in range(20)))
        assert tokens == ["shared-token"] * 20
        assert calls == 1
    finally:
        await provider.close()
        await client.aclose()


@pytest.mark.asyncio
async def test_failed_token_endpoint_is_translated(logger) -> None:
    transport = httpx.MockTransport(
        lambda _request: httpx.Response(401, json={"error": "invalid_client"})
    )
    client = httpx.AsyncClient(transport=transport)
    provider = OAuthTokenProvider(oauth_settings(), logger, client=client)
    try:
        with pytest.raises(OAuthTokenError) as captured:
            await provider.get_access_token()
        assert captured.value.code == "oauth_token_rejected"
    finally:
        await provider.close()
        await client.aclose()
