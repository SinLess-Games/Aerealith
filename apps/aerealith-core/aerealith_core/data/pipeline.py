# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Per-source transactions: bounded streaming, disk-backed dedup, crash recovery."""

import hashlib
import json
import sqlite3
import time
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict
from pathlib import Path

from ..config import PreprocessConfig
from ..io import atomic_json, atomic_path, checksum, output_lock
from ..observability import event
from .discovery import discover
from .loaders import REGISTRY, extension_for
from .quality import acceptable, normalize

PIPELINE_VERSION = "1"


def source_identity(path: Path, root: Path) -> str:
    # Paths remain private in user-owned state; training records only carry opaque IDs.
    return hashlib.sha256(path.relative_to(root).as_posix().encode()).hexdigest()


def ingest(
    root: Path,
    output: Path,
    config: PreprocessConfig,
    *,
    resume: bool = False,
    force: bool = False,
) -> dict:
    root, output = root.resolve(), output.resolve()
    if root == output or root in output.parents or output in root.parents:
        raise ValueError("Input and output directories must not overlap")
    with output_lock(output):
        db = sqlite3.connect(output / "manifest.sqlite")
        db.execute("PRAGMA journal_mode=WAL")
        db.execute("PRAGMA synchronous=FULL")
        db.execute(
            "CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, config TEXT)"
        )
        db.execute("""CREATE TABLE IF NOT EXISTS sources (
            id TEXT PRIMARY KEY, fingerprint TEXT, size INTEGER, mtime INTEGER,
            status TEXT, records INTEGER, rejected INTEGER, duplicates INTEGER,
            checksum TEXT, error TEXT, completed REAL)""")
        db.execute(
            "CREATE TABLE IF NOT EXISTS hashes (hash TEXT PRIMARY KEY, source TEXT)"
        )
        db.execute(
            "CREATE TABLE IF NOT EXISTS source_paths (id TEXT PRIMARY KEY, path TEXT)"
        )
        db.execute("CREATE TEMP TABLE seen (id TEXT PRIMARY KEY)")
        settings = json.dumps(
            {"root": str(root), "config": asdict(config), "version": PIPELINE_VERSION},
            sort_keys=True,
        )
        previous = db.execute("SELECT config FROM settings WHERE id=1").fetchone()
        if previous and not resume and not force:
            db.close()
            raise ValueError("Output already exists; use --resume or --force")
        if previous and previous[0] != settings and not force:
            db.close()
            raise ValueError("Input/config changed; use --force to rebuild")
        if force:
            db.execute("DELETE FROM source_paths")
            db.execute("DELETE FROM hashes")
            db.execute("DELETE FROM sources")
            for path in output.glob("*.jsonl"):
                path.unlink()
        db.execute("INSERT OR REPLACE INTO settings VALUES (1,?)", (settings,))
        db.commit()
        total_documents = sum(1 for _ in discover(root))
        started = time.monotonic()
        skipped = 0

        # Workers hash a bounded window of source files, while commits stay ordered.
        def fingerprints() -> Iterator[tuple[Path, str | None]]:
            def fingerprint(path: Path):
                try:
                    return path, checksum(path)
                except OSError:
                    return path, None

            with ThreadPoolExecutor(max_workers=config.workers) as pool:
                iterator = iter(discover(root))
                while True:
                    batch = []
                    for _ in range(config.workers * 2):
                        try:
                            batch.append(next(iterator))
                        except StopIteration:
                            break
                    if not batch:
                        break
                    yield from pool.map(fingerprint, batch)

        try:
            for path, fingerprint in fingerprints():
                source_id = source_identity(path, root)
                db.execute("INSERT INTO seen VALUES (?)", (source_id,))
                db.execute(
                    "INSERT OR REPLACE INTO source_paths VALUES (?,?)",
                    (source_id, path.relative_to(root).as_posix()),
                )
                db.commit()
                stat = path.stat()
                target = output / f"{source_id}.jsonl"
                previous = db.execute(
                    "SELECT fingerprint,status,checksum FROM sources WHERE id=?",
                    (source_id,),
                ).fetchone()
                if previous and previous[0] != fingerprint:
                    # Changing one completed source can invalidate dedup decisions downstream.
                    raise ValueError(
                        "Source changed; use --force to rebuild exact dedup consistently"
                    )
                if (
                    previous
                    and previous[1] == "complete"
                    and target.exists()
                    and checksum(target) == previous[2]
                ):
                    skipped += 1
                    continue
                db.execute("DELETE FROM hashes WHERE source=?", (source_id,))
                db.execute(
                    "INSERT OR REPLACE INTO sources VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                    (
                        source_id,
                        fingerprint,
                        stat.st_size,
                        stat.st_mtime_ns,
                        "processing",
                        0,
                        0,
                        0,
                        None,
                        None,
                        None,
                    ),
                )
                db.commit()
                records = rejected = duplicates = 0
                try:
                    if fingerprint is None:
                        raise OSError("Source unreadable")
                    suffix = extension_for(path)
                    if suffix not in REGISTRY:
                        raise ValueError("Unsupported file extension")
                    with atomic_path(target) as temporary:
                        with temporary.open("w", encoding="utf-8") as stream:
                            for index, raw in enumerate(
                                REGISTRY[suffix](path, config.max_document_bytes)
                            ):
                                text = normalize(raw, config)
                                if not acceptable(text, config):
                                    rejected += 1
                                    continue
                                digest = hashlib.sha256(text.encode()).hexdigest()
                                inserted = db.execute(
                                    "INSERT OR IGNORE INTO hashes VALUES (?,?)",
                                    (digest, source_id),
                                ).rowcount
                                if config.deduplicate and not inserted:
                                    duplicates += 1
                                    continue
                                record = {
                                    "text": text,
                                    "source": source_id,
                                    "source_type": suffix,
                                    "metadata": {
                                        "document_id": digest,
                                        "record_id": index,
                                        "pipeline_version": PIPELINE_VERSION,
                                    },
                                }
                                stream.write(
                                    json.dumps(record, ensure_ascii=False) + "\n"
                                )
                                records += 1
                        # Validate streaming JSON before publishing, including an empty valid shard.
                        with temporary.open() as stream:
                            for line in stream:
                                json.loads(line)
                        current_stat = path.stat()
                        if (current_stat.st_size, current_stat.st_mtime_ns) != (
                            stat.st_size,
                            stat.st_mtime_ns,
                        ):
                            raise ValueError("Source mutated during parsing")
                        digest = checksum(temporary)
                    db.execute(
                        "UPDATE sources SET status='complete',records=?,rejected=?,duplicates=?,checksum=?,completed=? WHERE id=?",
                        (records, rejected, duplicates, digest, time.time(), source_id),
                    )
                    db.commit()
                except Exception as exc:
                    db.rollback()
                    target.unlink(missing_ok=True)
                    # Exception text can contain input data: store only its type.
                    db.execute(
                        "UPDATE sources SET status='failed',error=? WHERE id=?",
                        (type(exc).__name__, source_id),
                    )
                    db.commit()
                    event(
                        "ingest_failure",
                        source=source_id,
                        error_type=type(exc).__name__,
                    )
                counts = db.execute(
                    "SELECT count(*),coalesce(sum(records),0),coalesce(sum(size),0) FROM sources WHERE status='complete'"
                ).fetchone()
                event(
                    "ingest_progress",
                    documents_processed=counts[0],
                    total_documents=total_documents,
                    bytes_per_second=counts[2] / max(time.monotonic() - started, 1e-9),
                    records=counts[1],
                    bytes_processed=counts[2],
                    seconds=time.monotonic() - started,
                )
            if db.execute(
                "SELECT 1 FROM sources LEFT JOIN seen USING(id) WHERE seen.id IS NULL LIMIT 1"
            ).fetchone():
                raise ValueError("Source removed; use --force to rebuild consistently")
            totals = db.execute(
                "SELECT count(*),coalesce(sum(records),0),coalesce(sum(rejected),0),coalesce(sum(duplicates),0),coalesce(sum(size),0) FROM sources WHERE status='complete'"
            ).fetchone()
            failures = db.execute(
                "SELECT id,error FROM sources WHERE status='failed'"
            ).fetchall()
            report = dict(
                zip(
                    ("documents", "records", "rejected", "duplicates", "bytes"),
                    totals,
                    strict=True,
                )
            )
            report.update(
                skipped=skipped,
                failures=[{"source": r[0], "error_type": r[1]} for r in failures],
                seconds=time.monotonic() - started,
            )
            atomic_json(output / "report.json", report)
            return report
        finally:
            db.close()


def processed_records(root: Path) -> Iterator[dict]:
    """Only manifest-committed files are consumable; never read orphan outputs."""
    with sqlite3.connect(
        f"file:{root.resolve() / 'manifest.sqlite'}?mode=ro", uri=True
    ) as db:
        for source, digest in db.execute(
            "SELECT id,checksum FROM sources WHERE status='complete' ORDER BY id"
        ):
            path = root / f"{source}.jsonl"
            if checksum(path) != digest:
                raise ValueError("Processed source checksum mismatch")
            with path.open(encoding="utf-8") as stream:
                for line in stream:
                    yield json.loads(line)
