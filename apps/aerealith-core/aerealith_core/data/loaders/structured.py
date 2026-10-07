# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Safe semantic readers. CSV and JSONL process one bounded record at a time."""

import csv
import json
from collections.abc import Iterator
from pathlib import Path

import ijson
import yaml
from defusedxml import ElementTree

from .base import bounded_read, validate_text


def serialize(value: object, max_bytes: int) -> str:
    parts = []
    size = 0
    encoder = json.JSONEncoder(ensure_ascii=False, sort_keys=True, default=str)
    for part in encoder.iterencode(value):
        size += len(part.encode("utf-8"))
        if size > max_bytes:
            raise ValueError("Serialized record exceeds limit")
        parts.append(part)
    return validate_text("".join(parts), max_bytes)


def load_csv(path: Path, max_bytes: int) -> Iterator[str]:
    delimiter = "\t" if path.suffix.lower() == ".tsv" else ","
    csv.field_size_limit(max_bytes)
    with path.open(encoding="utf-8-sig", newline="") as stream:
        # Limit physical lines and records to avoid unbounded CSV field allocation.
        record_bytes = 0

        def lines() -> Iterator[str]:
            nonlocal record_bytes
            while line := stream.readline(max_bytes + 1):
                record_bytes += len(line.encode("utf-8"))
                if record_bytes > max_bytes:
                    raise ValueError("CSV line exceeds limit")
                yield line

        for row in csv.DictReader(lines(), delimiter=delimiter):
            record_bytes = 0
            yield serialize(row, max_bytes)


def load_jsonl(path: Path, max_bytes: int) -> Iterator[str]:
    with path.open("rb") as stream:
        while line := stream.readline(max_bytes + 1):
            if len(line) > max_bytes:
                raise ValueError("JSONL record exceeds limit")
            if line.strip():
                yield serialize(json.loads(line), max_bytes)


class LimitedArrayReader:
    """Enforce raw top-level item budgets before ijson allocates objects/strings."""

    def __init__(self, stream, max_bytes: int):
        self.stream = stream
        self.max_bytes = max_bytes
        self.started = False
        self.quoted = self.escaped = False
        self.depth = self.item_bytes = 0

    def read(self, size: int = -1) -> bytes:
        data = self.stream.read(size)
        for char in data:
            if not self.started:
                if char == 91:
                    self.started = True
                continue
            self.item_bytes += 1
            if self.item_bytes > self.max_bytes:
                raise ValueError("JSON array item exceeds configured size limit")
            if self.quoted:
                if self.escaped:
                    self.escaped = False
                elif char == 92:
                    self.escaped = True
                elif char == 34:
                    self.quoted = False
            elif char == 34:
                self.quoted = True
            elif char in (91, 123):
                self.depth += 1
            elif char in (93, 125) and self.depth:
                self.depth -= 1
            elif char in (44, 93) and self.depth == 0:
                self.item_bytes = 0
        return data


def load_json(path: Path, max_bytes: int) -> Iterator[str]:
    # Top-level arrays stream one object; other JSON structures have a size cap.
    with path.open("rb") as stream:
        first = b""
        while not first:
            char = stream.read(1)
            if not char:
                raise ValueError("Empty JSON")
            first = char.strip()
        stream.seek(0)
        if first == b"[":
            for item in ijson.items(
                LimitedArrayReader(stream, max_bytes), "item", use_float=True
            ):
                yield serialize(item, max_bytes)
        else:
            yield serialize(json.loads(bounded_read(path, max_bytes)), max_bytes)


def load_yaml(path: Path, max_bytes: int) -> Iterator[str]:
    text = bounded_read(path, max_bytes)
    for item in yaml.safe_load_all(text):
        if item is not None:
            yield serialize(item, max_bytes)


def load_xml(path: Path, max_bytes: int) -> Iterator[str]:
    # DefusedXML rejects entities/DTD attacks and never follows external resources.
    text = bounded_read(path, max_bytes)
    root = ElementTree.fromstring(text, forbid_dtd=True)

    def semantic(element):
        return {
            "tag": element.tag,
            "attributes": element.attrib,
            "text": (element.text or "").strip(),
            "children": [semantic(child) for child in element],
            "tail": (element.tail or "").strip(),
        }

    yield serialize(semantic(root), max_bytes)
