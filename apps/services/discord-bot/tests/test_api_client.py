"""Persistent Aerealith API client behavior tests."""

from __future__ import annotations

import httpx
import pytest

import discord_bot.api.client as client_module
from discord_bot.api.client import AerealithAPIClient
from discord_bot.api.errors import (
    APIAuthenticationError,
    APIRequestError,
    APIResponseValidationError,
    APITimeoutError,
)
from discord_bot.core.config import APISettings
from discord_bot.utils.retry import RetryPolicy


class StubTokens:
    def __init__(self) -> None:
        self.invalidated = False

    async def get_access_token(self) -> str:
        return "service-token"

    def invalidate(self) -> None:
        self.invalidated = True


def api_settings() -> APISettings:
    return APISettings.model_validate({"base_url": "https://api.example.test"})


@pytest.mark.asyncio
async def test_auth_headers_request_ids_and_success(logger) -> None:
    seen: httpx.Request | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen
        seen = request
        return httpx.Response(200, json={"ok": True})

    http = httpx.AsyncClient(
        base_url="https://api.example.test",
        transport=httpx.MockTransport(handler),
    )
    client = AerealithAPIClient(api_settings(), StubTokens(), logger, client=http)
    try:
        assert await client.get("health", trace_id="trace-test") == {"ok": True}
        assert seen is not None
        assert seen.headers["Authorization"] == "Bearer service-token"
        assert seen.headers["X-Request-ID"]
        assert seen.headers["X-Trace-ID"] == "trace-test"
    finally:
        await client.close()
        await http.aclose()


@pytest.mark.asyncio
async def test_4xx_is_translated_without_raw_httpx_error(logger) -> None:
    http = httpx.AsyncClient(
        base_url="https://api.example.test",
        transport=httpx.MockTransport(
            lambda _request: httpx.Response(404, json={"error": "missing"})
        ),
    )
    client = AerealithAPIClient(api_settings(), StubTokens(), logger, client=http)
    try:
        with pytest.raises(APIRequestError) as captured:
            await client.get("missing")
        assert captured.value.details["status_code"] == 404
    finally:
        await client.close()
        await http.aclose()


@pytest.mark.asyncio
async def test_5xx_retries_then_succeeds(logger, monkeypatch) -> None:
    monkeypatch.setattr(
        client_module,
        "HTTP_RETRY_POLICY",
        RetryPolicy(attempts=3, minimum_wait_seconds=0, maximum_wait_seconds=0),
    )
    calls = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        if calls < 3:
            return httpx.Response(503, json={"error": "unavailable"})
        return httpx.Response(200, json={"ok": True})

    http = httpx.AsyncClient(
        base_url="https://api.example.test",
        transport=httpx.MockTransport(handler),
    )
    client = AerealithAPIClient(api_settings(), StubTokens(), logger, client=http)
    try:
        assert await client.get("eventual") == {"ok": True}
        assert calls == 3
    finally:
        await client.close()
        await http.aclose()


@pytest.mark.asyncio
async def test_timeout_is_translated_after_retries(logger, monkeypatch) -> None:
    monkeypatch.setattr(
        client_module,
        "HTTP_RETRY_POLICY",
        RetryPolicy(attempts=2, minimum_wait_seconds=0, maximum_wait_seconds=0),
    )

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("slow", request=request)

    http = httpx.AsyncClient(
        base_url="https://api.example.test",
        transport=httpx.MockTransport(handler),
    )
    client = AerealithAPIClient(api_settings(), StubTokens(), logger, client=http)
    try:
        with pytest.raises(APITimeoutError):
            await client.get("slow")
    finally:
        await client.close()
        await http.aclose()


@pytest.mark.asyncio
async def test_authentication_rejection_invalidates_token(logger) -> None:
    tokens = StubTokens()
    http = httpx.AsyncClient(
        base_url="https://api.example.test",
        transport=httpx.MockTransport(
            lambda _request: httpx.Response(401, json={"error": "expired"})
        ),
    )
    client = AerealithAPIClient(api_settings(), tokens, logger, client=http)
    try:
        with pytest.raises(APIAuthenticationError):
            await client.get("protected")
        assert tokens.invalidated
    finally:
        await client.close()
        await http.aclose()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("body", "limit", "code"),
    [
        (b"not-json", 100, "invalid_api_json"),
        (b"12345", 4, "api_response_too_large"),
    ],
)
async def test_response_validation_is_bounded_and_translated(
    logger,
    monkeypatch,
    body: bytes,
    limit: int,
    code: str,
) -> None:
    monkeypatch.setattr(client_module, "MAXIMUM_RESPONSE_BYTES", limit)
    http = httpx.AsyncClient(
        base_url="https://api.example.test",
        transport=httpx.MockTransport(
            lambda _request: httpx.Response(200, content=body)
        ),
    )
    client = AerealithAPIClient(api_settings(), StubTokens(), logger, client=http)
    try:
        with pytest.raises(APIResponseValidationError) as captured:
            await client.get("response")
        assert captured.value.code == code
    finally:
        await client.close()
        await http.aclose()
