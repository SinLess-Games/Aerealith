# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Streaming readers for downloaded corpus shards; optional raw dependencies."""

import bz2
import gzip
import io
import json
from collections.abc import Iterator
from pathlib import Path
from typing import Any

from defusedxml import ElementTree

from .base import validate_text


def corpus_text(record: object, max_bytes: int) -> str:
    if isinstance(record, str):
        return validate_text(record, max_bytes)
    if not isinstance(record, dict):
        raise ValueError("Expected a corpus record with text")
    for key in ("text", "document", "content", "code", "article", "body"):
        value = record.get(key)
        if isinstance(value, list) and all(isinstance(item, str) for item in value):
            value = "\n".join(value)
        if isinstance(value, str):
            return validate_text(value, max_bytes)
    raise ValueError("No text field; metadata-only datasets need content retrieval")


def load_parquet(path: Path, max_bytes: int) -> Iterator[str]:
    import pyarrow.parquet as parquet

    with parquet.ParquetFile(path) as source:
        columns = [
            key
            for key in ("text", "document", "content", "code", "article", "body")
            if key in source.schema_arrow.names
        ]
        if not columns:
            raise ValueError(
                "Parquet has no text column; retrieve source content first"
            )
        # Read only text columns in small batches, never materialize the entire shard.
        for batch in source.iter_batches(batch_size=64, columns=columns):
            for record in batch.to_pylist():
                yield corpus_text(record, max_bytes)


def xml_records(stream, max_bytes: int) -> Iterator[str]:
    stack = []
    for event, element in ElementTree.iterparse(
        stream, events=("start", "end"), forbid_dtd=True
    ):
        if event == "start":
            stack.append(element)
            continue
        tag = element.tag.rsplit("}", 1)[-1]
        if tag in {"page", "PubmedArticle", "PubmedBookArticle"}:
            if tag == "page":
                # Wikipedia redirect pages add no training prose.
                if not any(
                    node.tag.rsplit("}", 1)[-1] == "redirect" for node in element
                ):
                    parts = [
                        node.text or ""
                        for node in element.iter()
                        if node.tag.rsplit("}", 1)[-1] in {"title", "text"}
                    ]
                    yield validate_text("\n".join(parts), max_bytes)
            else:
                parts = [
                    "".join(node.itertext())
                    for node in element.iter()
                    if node.tag.rsplit("}", 1)[-1] in {"ArticleTitle", "AbstractText"}
                ]
                yield validate_text("\n".join(parts), max_bytes)
            if len(stack) > 1:
                stack[-2].remove(element)
            element.clear()
        stack.pop()


def load_compressed(path: Path, max_bytes: int) -> Iterator[str]:
    with path.open("rb") as raw:
        decoded: Any
        if path.suffix == ".gz":
            decoded = gzip.GzipFile(fileobj=raw)
        elif path.suffix == ".bz2":
            decoded = bz2.BZ2File(raw)
        else:
            import zstandard

            decoded = zstandard.ZstdDecompressor().stream_reader(raw)
        with decoded:
            name = path.stem.lower()
            if name.endswith(".xml"):
                yield from xml_records(decoded, max_bytes)
            else:
                with io.BufferedReader(decoded) as stream:
                    parts: list[str] = []
                    block_bytes = 0
                    block_limit = min(max_bytes, 65536)
                    while line := stream.readline(max_bytes + 1):
                        if len(line) > max_bytes:
                            raise ValueError(
                                "Compressed record exceeds configured limit"
                            )
                        if not line.strip():
                            continue
                        if name.endswith((".json", ".jsonl", ".ndjson")):
                            yield corpus_text(json.loads(line), max_bytes)
                        else:
                            # Batch RDF triples to avoid a dedup/index row per triple.
                            if parts and block_bytes + len(line) > block_limit:
                                yield validate_text("".join(parts), max_bytes)
                                parts = []
                                block_bytes = 0
                            parts.append(line.decode("utf-8"))
                            block_bytes += len(line)
                    if parts:
                        yield validate_text("".join(parts), max_bytes)
