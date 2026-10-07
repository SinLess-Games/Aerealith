# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

import unicodedata
from typing import Protocol

from ..config import PreprocessConfig


class NearDuplicateIndex(Protocol):
    """Optional future MinHash/LSH adapter; exact dedup is the default."""

    def contains(self, text: str) -> bool: ...
    def add(self, document_id: str, text: str) -> None: ...


def normalize(text: str, config: PreprocessConfig) -> str:
    text = (
        unicodedata.normalize(config.unicode_form, text)
        .replace("\r\n", "\n")
        .replace("\r", "\n")
    )
    # Preserve indentation and internal spaces, especially for code.
    return "\n".join(line.rstrip() for line in text.split("\n")).strip("\n")


def acceptable(text: str, config: PreprocessConfig) -> bool:
    if len(text) < config.min_chars or not text.strip():
        return False
    printable = sum(c.isprintable() or c in "\n\t" for c in text)
    return printable / len(text) >= config.min_printable_ratio
