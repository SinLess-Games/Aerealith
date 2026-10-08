# SPDX-License-Identifier: AGPL-3.0-only
"""Prepare immutable train/eval splits and absolute pipeline configuration."""

import argparse
import hashlib
import json
import os
import shutil
import sqlite3
import tempfile
from pathlib import Path

from aerealith_core.config import ModelConfig, TrainConfig
from aerealith_core.data.pipeline import processed_records
from aerealith_core.io import atomic_json, checksum, output_lock
from aerealith_core.tokenizer import inspect_tokenizer


def split(root: Path):
    source = root / "processed"
    with sqlite3.connect(f"file:{source / 'manifest.sqlite'}?mode=ro", uri=True) as db:
        sources = db.execute(
            "SELECT id,checksum FROM sources WHERE status='complete' ORDER BY id"
        ).fetchall()
        if db.execute(
            "SELECT count(*) FROM sources WHERE status != 'complete'"
        ).fetchone()[0]:
            raise ValueError("Processing has incomplete sources")
    signature = hashlib.sha256(
        json.dumps([sources, "split-v2-5-percent"]).encode()
    ).hexdigest()
    output = root / "pipeline" / "split"
    with output_lock(root / "pipeline"):
        if output.exists():
            if (
                json.loads((output / "split.json").read_text())["signature"]
                != signature
            ):
                raise ValueError(
                    "Processed corpus changed after splitting; use a fresh data root"
                )
            for subset in ("train", "eval"):
                for _ in processed_records(output / subset):
                    pass
            print("Reusing verified train/eval split")
            return
        temporary = Path(tempfile.mkdtemp(prefix=".split-", dir=root / "pipeline"))
        counts = {"train": 0, "eval": 0}
        try:
            from contextlib import ExitStack, closing

            with ExitStack() as stack:
                streams = {}
                databases = {}
                for subset in counts:
                    directory = temporary / subset
                    directory.mkdir()
                    db = stack.enter_context(
                        closing(sqlite3.connect(directory / "manifest.sqlite"))
                    )
                    stack.enter_context(db)
                    db.execute(
                        "CREATE TABLE hashes (hash TEXT PRIMARY KEY, source TEXT)"
                    )
                    databases[subset] = db
                    streams[subset] = stack.enter_context(
                        (directory / "records.jsonl").open("w", encoding="utf-8")
                    )
                for index, record in enumerate(processed_records(source)):
                    # First two records guarantee both sets; subsequent documents use a stable hash.
                    digest = hashlib.sha256(record["text"].encode()).hexdigest()
                    subset = (
                        "eval"
                        if index == 0 or (index > 1 and int(digest[:8], 16) % 20 == 0)
                        else "train"
                    )
                    streams[subset].write(json.dumps(record, ensure_ascii=False) + "\n")
                    databases[subset].execute(
                        "INSERT INTO hashes VALUES (?,?)", (digest, "records")
                    )
                    counts[subset] += 1
            if not all(counts.values()):
                raise ValueError(
                    "Need at least two distinct accepted documents for train/eval"
                )
            for subset in counts:
                directory = temporary / subset
                with sqlite3.connect(directory / "manifest.sqlite") as db:
                    db.execute(
                        "CREATE TABLE sources (id TEXT PRIMARY KEY, checksum TEXT, status TEXT)"
                    )
                    db.execute(
                        "INSERT INTO sources VALUES (?,?,?)",
                        ("records", checksum(directory / "records.jsonl"), "complete"),
                    )
            atomic_json(
                temporary / "split.json", {"signature": signature, "records": counts}
            )
            os.rename(temporary, output)
            print(json.dumps(counts))
        finally:
            if temporary.exists():
                shutil.rmtree(temporary)


def configure(root: Path, training_path: Path, model_path: Path | None):
    training = json.loads(training_path.read_text())
    app = Path(__file__).resolve().parents[2] / "apps" / "aerealith-core"
    model_path = model_path or Path(
        training.get("model_config", "configs/model-312m.json")
    )
    if not model_path.is_absolute():
        model_path = app / model_path
    model = json.loads(model_path.read_text())
    model["vocab_size"] = inspect_tokenizer(root / "tokenizer" / "tokenizer.json")[
        "vocab_size"
    ]
    ModelConfig(**model)
    sequence_length = min(
        training.get("sequence_length", 8192), model.get("context_length", 8192)
    )
    directory = root / "pipeline" / "configs"
    training.update(
        model_config=str(directory / "model.json"),
        train_shards=str(root / "shards"),
        validation_shards=str(root / "eval" / "shards"),
        tokenizer=str(root / "tokenizer" / "tokenizer.json"),
        output=str(root / "checkpoints"),
        sequence_length=sequence_length,
    )
    TrainConfig(**training)
    # Changing training/model settings under an existing checkpoint must be intentional.
    if (
        (root / "checkpoints" / "latest.pt").exists()
        and (directory / "training.json").exists()
        and (
            json.loads((directory / "training.json").read_text()) != training
            or json.loads((directory / "model.json").read_text()) != model
        )
    ):
        raise ValueError("Checkpoint config changed; use a fresh data root")
    atomic_json(directory / "model.json", model)
    atomic_json(directory / "training.json", training)
    atomic_json(
        directory / "evaluation.json",
        {
            "sequence_length": sequence_length,
            "batches": training.get("validation_batches", 20),
        },
    )
    atomic_json(
        directory / "tokenize.json",
        {"sequence_length": sequence_length, "tokens_per_shard": 16777216},
    )
    print(f"Configured model with {model['vocab_size']} tokenizer entries")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("stage", choices=["split", "configure"])
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--training-config", type=Path)
    parser.add_argument("--model-config", type=Path)
    args = parser.parse_args()
    if args.stage == "split":
        split(args.root.resolve())
    else:
        if args.training_config is None:
            parser.error("configure requires --training-config")
        configure(args.root.resolve(), args.training_config, args.model_config)
