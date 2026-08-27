"""Process-local bounded TTL cache tests."""

from __future__ import annotations

import asyncio

import pytest

from discord_bot.cache.memory import AsyncTTLCache


@pytest.mark.asyncio
async def test_set_get_expiry_and_invalidation() -> None:
    now = [0.0]
    cache: AsyncTTLCache[str, str] = AsyncTTLCache(
        maximum_entries=2,
        default_ttl_seconds=10,
        clock=lambda: now[0],
    )
    await cache.set("a", "one")
    assert await cache.get("a") == "one"
    assert await cache.delete("a") is True
    assert await cache.get("a") is None

    await cache.set("b", "two")
    now[0] = 11
    assert await cache.get("b") is None
    statistics = await cache.statistics()
    assert statistics.expirations == 1


@pytest.mark.asyncio
async def test_maximum_entries_evicts_least_recently_used() -> None:
    cache: AsyncTTLCache[str, int] = AsyncTTLCache(
        maximum_entries=2,
        default_ttl_seconds=10,
    )
    await cache.set("a", 1)
    await cache.set("b", 2)
    assert await cache.get("a") == 1
    await cache.set("c", 3)
    assert await cache.get("b") is None
    assert await cache.get("a") == 1
    assert (await cache.statistics()).evictions == 1


@pytest.mark.asyncio
async def test_get_or_load_prevents_stampede() -> None:
    cache: AsyncTTLCache[str, int] = AsyncTTLCache(
        maximum_entries=10,
        default_ttl_seconds=10,
    )
    calls = 0

    async def loader() -> int:
        nonlocal calls
        calls += 1
        await asyncio.sleep(0)
        return 42

    values = await asyncio.gather(
        *(cache.get_or_load("shared", loader) for _ in range(30))
    )
    assert values == [42] * 30
    assert calls == 1
    assert (await cache.statistics()).loads == 1
