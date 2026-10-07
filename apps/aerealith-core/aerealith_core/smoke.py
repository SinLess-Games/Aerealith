# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Reproducible end-to-end CLI exercise, all artifacts in a temporary directory."""

import json
import tempfile
from dataclasses import asdict
from pathlib import Path

import torch

from .cli import main
from .config import ModelConfig, TrainConfig
from .dataset import TokenDataset
from .shards import shard_metadata


def run() -> None:
    torch.set_num_threads(1)
    with tempfile.TemporaryDirectory(prefix="aerealith-core-smoke-") as temporary:
        root = Path(temporary)
        raw, val_raw = root / "raw", root / "val-raw"
        raw.mkdir()
        val_raw.mkdir()
        (raw / "example.txt").write_text(
            "Hello Aerealith. We train our own language model. " * 8
        )
        (val_raw / "evaluation.md").write_text(
            "Planets orbit distant stars. Astronomy studies space. " * 8
        )
        processed, val_processed = root / "processed", root / "val-processed"
        tokenizer, shards, val_shards = (
            root / "tokenizer.json",
            root / "shards",
            root / "val-shards",
        )
        tokenizer_config = root / "tokenizer-config.json"
        tokenizer_config.write_text('{"vocab_size":260,"min_frequency":1}')
        shard_config = root / "shards-config.json"
        shard_config.write_text('{"tokens_per_shard":64,"sequence_length":8}')
        model_config = root / "model.json"
        model_config.write_text(
            json.dumps(
                asdict(
                    ModelConfig(
                        vocab_size=260,
                        context_length=16,
                        layers=2,
                        hidden_dim=32,
                        heads=4,
                        kv_heads=2,
                        intermediate_dim=64,
                    )
                )
            )
        )
        train_config = root / "train.json"
        train_config.write_text(
            json.dumps(
                asdict(
                    TrainConfig(
                        model_config=str(model_config),
                        train_shards=str(shards),
                        validation_shards=str(val_shards),
                        tokenizer=str(tokenizer),
                        output=str(root / "checkpoints"),
                        steps=2,
                        batch_size=1,
                        accumulation_steps=1,
                        sequence_length=8,
                        warmup_steps=1,
                        checkpoint_interval=1,
                        validation_interval=1,
                        validation_batches=2,
                    )
                )
            )
        )
        evaluation_config = root / "evaluation.json"
        evaluation_config.write_text('{"batches":2,"batch_size":1,"sequence_length":8}')

        def command(*arguments):
            if main([str(arg) for arg in arguments]) != 0:
                raise RuntimeError("Smoke CLI failed")

        command("ingest", "--input", raw, "--output", processed)
        command("ingest", "--input", raw, "--output", processed, "--resume")
        command("ingest", "--input", val_raw, "--output", val_processed)
        command(
            "tokenizer",
            "train",
            "--input",
            processed,
            "--output",
            tokenizer,
            "--config",
            tokenizer_config,
        )
        command("tokenizer", "inspect", "--tokenizer", tokenizer)
        for inputs, output in ((processed, shards), (val_processed, val_shards)):
            command(
                "tokenize",
                "--input",
                inputs,
                "--output",
                output,
                "--tokenizer",
                tokenizer,
                "--config",
                shard_config,
            )
        command(
            "tokenize",
            "--input",
            processed,
            "--output",
            shards,
            "--tokenizer",
            tokenizer,
            "--config",
            shard_config,
            "--resume",
        )
        dataset = TokenDataset(shards, 8)
        assert dataset[0][0].numel() == 8
        assert sum(m["tokens"] for m in shard_metadata(shards)) == dataset.total_tokens
        command("inspect", "--shards", shards)
        command(
            "stats",
            "--model-config",
            model_config,
            "--shards",
            shards,
            "--target",
            "25",
        )
        command("train", "--config", train_config)
        checkpoint = root / "checkpoints/latest.pt"
        command("train", "--config", train_config, "--resume", checkpoint)
        command(
            "evaluate",
            "--checkpoint",
            checkpoint,
            "--shards",
            val_shards,
            "--config",
            evaluation_config,
        )
        command(
            "generate",
            "--checkpoint",
            checkpoint,
            "--tokenizer",
            tokenizer,
            "--prompt",
            "Hello",
            "--max-new-tokens",
            "3",
            "--temperature",
            "0",
        )
        print(json.dumps({"smoke": "passed", "training_tokens": dataset.total_tokens}))


if __name__ == "__main__":
    run()
