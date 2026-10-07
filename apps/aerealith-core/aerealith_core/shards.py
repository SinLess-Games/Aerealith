# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Transactional binary token shards with a bounded buffer and recoverable tail."""

import json
import math
import sqlite3
import time
import uuid
from dataclasses import asdict
from pathlib import Path

import numpy as np

from .config import TokenizeConfig
from .io import atomic_json, atomic_path, checksum, output_lock
from .observability import event
from .tokenizer import inspect_tokenizer, load_tokenizer

DTYPE = np.dtype("<u4")


def write_shard(
    output: Path,
    tokens: np.ndarray,
    number: int,
    identity: dict,
    config: TokenizeConfig,
) -> dict:
    name = f"shard-{number:06d}-{uuid.uuid4().hex}.bin"
    path = output / name
    with atomic_path(path) as temporary:
        tokens.astype(DTYPE, copy=False).tofile(temporary)
        if temporary.stat().st_size != len(tokens) * DTYPE.itemsize:
            raise ValueError("Shard length validation failed")
        digest = checksum(temporary)
    metadata = {
        "file": name,
        "number": number,
        "tokens": len(tokens),
        "dtype": DTYPE.str,
        "sha256": digest,
        "tokenizer": identity,
        "sequence_length": config.sequence_length,
        "pipeline_version": "1",
        "full": len(tokens) == config.tokens_per_shard,
    }
    atomic_json(path.with_suffix(".json"), metadata)
    return metadata


def shard_metadata(root: Path, *, verify: bool = True) -> list[dict]:
    with sqlite3.connect(
        f"file:{root.resolve() / 'manifest.sqlite'}?mode=ro", uri=True
    ) as db:
        result = [
            json.loads(row[0])
            for row in db.execute("SELECT metadata FROM shards ORDER BY number")
        ]
    for meta in result:
        path = root / meta["file"]
        if path.stat().st_size != meta["tokens"] * np.dtype(meta["dtype"]).itemsize:
            raise ValueError("Shard size mismatch")
        if verify and checksum(path) != meta["sha256"]:
            raise ValueError("Shard checksum mismatch")
    return result


def tokenize(
    input_dir: Path,
    output: Path,
    tokenizer_path: Path,
    config: TokenizeConfig,
    *,
    resume: bool = False,
    force: bool = False,
) -> dict:
    identity = inspect_tokenizer(tokenizer_path)
    tokenizer = load_tokenizer(tokenizer_path)
    if (
        output.resolve() == input_dir.resolve()
        or input_dir.resolve() in output.resolve().parents
        or output.resolve() in input_dir.resolve().parents
    ):
        raise ValueError("Token output must not overlap processed input")
    with output_lock(output):
        db = sqlite3.connect(output / "manifest.sqlite")
        db.execute("PRAGMA journal_mode=WAL")
        db.execute("PRAGMA synchronous=FULL")
        db.execute(
            "CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, config TEXT)"
        )
        db.execute(
            "CREATE TABLE IF NOT EXISTS sources (id TEXT PRIMARY KEY, checksum TEXT, records INTEGER, tokens INTEGER)"
        )
        db.execute(
            "CREATE TABLE IF NOT EXISTS shards (number INTEGER PRIMARY KEY, metadata TEXT)"
        )
        settings = json.dumps(
            {
                "tokenizer": identity,
                "config": asdict(config),
                "input": str(input_dir.resolve()),
            },
            sort_keys=True,
        )
        previous = db.execute("SELECT config FROM settings WHERE id=1").fetchone()
        if previous and not resume and not force:
            db.close()
            raise ValueError("Output exists; use --resume or --force")
        if previous and previous[0] != settings and not force:
            db.close()
            raise ValueError("Tokenizer/config/input changed; use --force")
        if force:
            db.execute("DELETE FROM sources")
            db.execute("DELETE FROM shards")
        db.execute("INSERT OR REPLACE INTO settings VALUES (1,?)", (settings,))
        db.commit()
        known = shard_metadata(output)
        active = {m["file"] for m in known}
        # A crash before database commit leaves orphan binaries; never consume them.
        for path in output.glob("shard-*.bin"):
            if path.name not in active:
                path.unlink()
                path.with_suffix(".json").unlink(missing_ok=True)
        for path in output.glob(".*.tmp"):
            path.unlink()
        buffer = np.empty(config.tokens_per_shard, dtype=DTYPE)
        filled = 0
        number = len(known)
        tail = known[-1] if known and not known[-1]["full"] else None
        if tail:
            filled = tail["tokens"]
            buffer[:filled] = np.fromfile(output / tail["file"], dtype=DTYPE)
            number -= 1
        started = time.monotonic()
        skipped = 0
        run_tokens = run_documents = 0
        source_db = sqlite3.connect(
            f"file:{input_dir.resolve() / 'manifest.sqlite'}?mode=ro", uri=True
        )
        total = source_db.execute(
            "SELECT count(*) FROM sources WHERE status='complete'"
        ).fetchone()[0]
        try:
            # Completed input entries must remain present and unchanged for an append resume.
            for source_id, old_digest in db.execute("SELECT id,checksum FROM sources"):
                current = source_db.execute(
                    "SELECT checksum FROM sources WHERE id=? AND status='complete'",
                    (source_id,),
                ).fetchone()
                if not current or current[0] != old_digest:
                    raise ValueError("Previously tokenized input changed; use --force")
            for source_id, digest in source_db.execute(
                "SELECT id,checksum FROM sources WHERE status='complete' ORDER BY id"
            ):
                if db.execute(
                    "SELECT 1 FROM sources WHERE id=?", (source_id,)
                ).fetchone():
                    skipped += 1
                    continue
                source = input_dir / f"{source_id}.jsonl"
                if checksum(source) != digest:
                    raise ValueError("Input checksum mismatch")
                records = tokens_generated = 0
                published = []
                with source.open(encoding="utf-8") as stream:
                    for line in stream:
                        record = json.loads(line)
                        tokens = [2, *tokenizer.encode(record["text"]).ids, 3]
                        records += 1
                        tokens_generated += len(tokens)
                        offset = 0
                        while offset < len(tokens):
                            count = min(
                                len(tokens) - offset, config.tokens_per_shard - filled
                            )
                            buffer[filled : filled + count] = tokens[
                                offset : offset + count
                            ]
                            filled += count
                            offset += count
                            if filled == config.tokens_per_shard:
                                published.append(
                                    write_shard(
                                        output, buffer, number, identity, config
                                    )
                                )
                                number += 1
                                filled = 0
                if filled:
                    published.append(
                        write_shard(output, buffer[:filled], number, identity, config)
                    )
                # Atomic DB commit simultaneously publishes all shards and completed source.
                if tail:
                    db.execute("DELETE FROM shards WHERE number=?", (tail["number"],))
                for meta in published:
                    db.execute(
                        "INSERT OR REPLACE INTO shards VALUES (?,?)",
                        (meta["number"], json.dumps(meta)),
                    )
                db.execute(
                    "INSERT INTO sources VALUES (?,?,?,?)",
                    (source_id, digest, records, tokens_generated),
                )
                db.commit()
                if tail:
                    (output / tail["file"]).unlink(missing_ok=True)
                    (output / tail["file"]).with_suffix(".json").unlink(missing_ok=True)
                tail = (
                    published[-1] if published and not published[-1]["full"] else None
                )
                counts = db.execute(
                    "SELECT count(*),coalesce(sum(tokens),0) FROM sources"
                ).fetchone()
                run_tokens += tokens_generated
                run_documents += 1
                elapsed = time.monotonic() - started
                event(
                    "tokenize_progress",
                    documents_processed=counts[0],
                    total_documents=total,
                    tokens_generated=counts[1],
                    current_shard=number,
                    completed_shards=number,
                    tokens_per_second=run_tokens / max(elapsed, 1e-9),
                    estimated_seconds_remaining=(total - counts[0])
                    * elapsed
                    / run_documents,
                )
            counts = db.execute(
                "SELECT count(*),coalesce(sum(records),0),coalesce(sum(tokens),0) FROM sources"
            ).fetchone()
            metas = shard_metadata(output, verify=False)
            report = {
                "documents": counts[0],
                "records": counts[1],
                "tokens": counts[2],
                "shards": len(metas),
                "full_shards": sum(m["full"] for m in metas),
                "partial_final_shard": bool(tail),
                "skipped": skipped,
                "seconds": time.monotonic() - started,
            }
            atomic_json(output / "report.json", report)
            return report
        finally:
            db.close()
            source_db.close()


def token_statistics(
    tokens: int, parameters: int, target: float = 20, shard_size: int = 16777216
) -> dict:
    if (
        tokens < 0
        or parameters <= 0
        or target <= 0
        or not math.isfinite(target)
        or shard_size <= 0
    ):
        raise ValueError("Invalid statistics inputs")
    required = math.ceil(parameters * target)
    return {
        "model_parameters": parameters,
        "training_tokens": tokens,
        "tokens_per_parameter": tokens / parameters,
        "target_tokens_per_parameter": target,
        "required_tokens": required,
        "additional_tokens": max(0, required - tokens),
        "required_shards": math.ceil(required / shard_size),
        "additional_shards": math.ceil(max(0, required - tokens) / shard_size),
    }
