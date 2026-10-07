# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

from collections.abc import Iterator
from pathlib import Path

from .base import validate_text


def load_pdf(path: Path, max_bytes: int) -> Iterator[str]:
    from pypdf import PdfReader

    # PDFs need cross-reference/random access; bound their input size explicitly.
    if path.stat().st_size > max_bytes:
        raise ValueError("PDF exceeds configured parser limit")
    reader = PdfReader(path, strict=True)
    if reader.is_encrypted:
        raise ValueError("Encrypted PDF unsupported")
    for page in reader.pages:
        yield validate_text(page.extract_text() or "", max_bytes)
