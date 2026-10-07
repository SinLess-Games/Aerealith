# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

import json

import pytest
import torch
from torch.utils.data import DataLoader

from aerealith_core.config import (
    GenerationConfig,
    ModelConfig,
    PreprocessConfig,
    TokenizeConfig,
    load_config,
)
from aerealith_core.data.pipeline import ingest
from aerealith_core.data.quality import normalize
from aerealith_core.dataset import TokenDataset, reject_leakage
from aerealith_core.generation import generate_tokens
from aerealith_core.model import Transformer
from aerealith_core.shards import tokenize
from aerealith_core.training import ResumableBatchSampler, seed_all


@pytest.mark.parametrize(
    "values",
    [
        {"layers": 0},
        {"heads": 3},
        {"kv_heads": 3},
        {"dropout": 1},
        {"typo": 42},
        {"layers": 1.5},
        {"tied_embeddings": "false"},
    ],
)
def test_invalid_configuration(tmp_path, values):
    path = tmp_path / "config.json"
    path.write_text(json.dumps(values))
    with pytest.raises(ValueError):
        load_config(ModelConfig, path)


def test_code_indentation_and_output_lock(tmp_path):
    from aerealith_core.io import output_lock

    assert normalize("    return 3  \n", PreprocessConfig()) == "    return 3"
    with output_lock(tmp_path):
        with pytest.raises(RuntimeError):
            with output_lock(tmp_path):
                pass


def test_overlap_across_distinct_shard_layout(corpus, tmp_path):
    raw, processed, tokenizer, shards = corpus
    validation_raw = tmp_path / "val-raw"
    validation_raw.mkdir()
    (validation_raw / "same.md").write_text((raw / "a.txt").read_text())
    validation_processed = tmp_path / "val-processed"
    ingest(
        validation_raw,
        validation_processed,
        PreprocessConfig(min_chars=1, deduplicate=False),
    )
    validation_shards = tmp_path / "val-shards"
    tokenize(validation_processed, validation_shards, tokenizer, TokenizeConfig(17, 8))
    with pytest.raises(ValueError, match="document overlap"):
        reject_leakage(TokenDataset(shards, 8), TokenDataset(validation_shards, 8))


def test_multiworker_order(corpus):
    *_, shards = corpus
    dataset = TokenDataset(shards, 8)

    def batches(workers):
        loader = DataLoader(
            dataset,
            batch_sampler=ResumableBatchSampler(len(dataset), 2, 42),
            num_workers=workers,
            multiprocessing_context="spawn" if workers else None,
        )
        iterator = iter(loader)
        return [next(iterator)[0] for _ in range(3)]

    for single, multi in zip(batches(0), batches(2), strict=True):
        torch.testing.assert_close(single, multi)


def test_sampling_seed_and_filtering():
    model = Transformer(
        ModelConfig(
            vocab_size=260,
            context_length=16,
            layers=1,
            hidden_dim=16,
            heads=2,
            kv_heads=1,
            intermediate_dim=32,
        )
    )
    config = GenerationConfig(
        max_new_tokens=5, temperature=0.7, top_k=4, top_p=0.8, repetition_penalty=1.2
    )
    prompt = torch.tensor([[2, 4]])
    seed_all(123)
    first = generate_tokens(model, prompt, config, eos_id=-1)
    seed_all(123)
    second = generate_tokens(model, prompt, config, eos_id=-1)
    torch.testing.assert_close(first, second)


def test_tokenizer_sample_budget_and_empty(tmp_path):
    from aerealith_core.config import TokenizerConfig
    from aerealith_core.tokenizer import train_tokenizer

    raw, processed = tmp_path / "raw", tmp_path / "processed"
    raw.mkdir()
    (raw / "text.txt").write_text(
        "A language model learns words from representative samples. " * 10
    )
    ingest(raw, processed, PreprocessConfig(min_chars=1))
    tokenizer = tmp_path / "tokenizer.json"
    train_tokenizer(
        processed,
        tokenizer,
        TokenizerConfig(vocab_size=260, max_training_bytes=100, max_training_records=1),
    )
    assert json.loads(tokenizer.with_suffix(".meta.json").read_text())[
        "training_sample"
    ] == {"bytes": 100, "records": 1}
    empty = tmp_path / "empty"
    empty.mkdir()
    empty_processed = tmp_path / "empty-processed"
    ingest(empty, empty_processed, PreprocessConfig())
    with pytest.raises(ValueError, match="empty"):
        train_tokenizer(
            empty_processed,
            tmp_path / "invalid-tokenizer.json",
            TokenizerConfig(vocab_size=260),
        )


def test_cli_end_to_end(capsys):
    from aerealith_core.smoke import run

    run()
    assert '"smoke": "passed"' in capsys.readouterr().out
