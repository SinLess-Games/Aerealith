# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

from collections.abc import Iterator
from pathlib import Path

from .base import validate_text


def load_text(path: Path, max_bytes: int) -> Iterator[str]:
    # Character blocks bound RAM even for huge logs/code or a single huge line.
    with path.open(encoding="utf-8-sig", errors="strict") as stream:
        while block := stream.read(max(1, max_bytes // 4)):
            yield validate_text(block, max_bytes)
