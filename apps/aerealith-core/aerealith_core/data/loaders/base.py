# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

from collections.abc import Iterator
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol


@dataclass(frozen=True)
class Document:
    text: str
    source: str
    source_type: str
    metadata: dict[str, Any] = field(default_factory=dict)


class Loader(Protocol):
    def __call__(self, path: Path, max_bytes: int) -> Iterator[str]: ...


def bounded_read(path: Path, max_bytes: int) -> str:
    if path.stat().st_size > max_bytes:
        raise ValueError("Structured document exceeds configured size limit")
    return path.read_text(encoding="utf-8-sig", errors="strict")


def validate_text(text: str, max_bytes: int) -> str:
    if "\x00" in text:
        raise ValueError("Binary content rejected")
    if len(text.encode("utf-8")) > max_bytes:
        raise ValueError("Record exceeds configured size limit")
    return text
