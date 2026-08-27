"""Dependency startup, shutdown, and partial-failure tests."""

from __future__ import annotations

import pytest

from discord_bot.core.dependencies import ApplicationDependencies
from discord_bot.music.service import MusicService


@pytest.mark.asyncio
async def test_resources_start_and_close_idempotently(
    settings_factory,
    logger,
) -> None:
    dependencies = ApplicationDependencies.create(settings_factory(), logger)
    await dependencies.start()
    assert dependencies.oauth.ready
    assert dependencies.api.ready
    assert dependencies.tasks.started

    await dependencies.close()
    await dependencies.close()
    assert not dependencies.oauth.ready
    assert not dependencies.api.ready
    assert not dependencies.tasks.started


@pytest.mark.asyncio
async def test_partial_startup_failure_closes_started_resources(
    settings_factory,
    logger,
    monkeypatch,
) -> None:
    async def fail_start(_service: MusicService) -> None:
        raise RuntimeError("lavalink startup failed")

    monkeypatch.setattr(MusicService, "start", fail_start)
    dependencies = ApplicationDependencies.create(settings_factory(), logger)

    with pytest.raises(RuntimeError, match="lavalink startup failed"):
        await dependencies.start()

    assert not dependencies.oauth.ready
    assert not dependencies.api.ready
    await dependencies.close()
