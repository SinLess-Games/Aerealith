# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Shared tiny streaming corpus fixture."""

import pytest

from aerealith_core.config import PreprocessConfig, TokenizeConfig, TokenizerConfig
from aerealith_core.data.pipeline import ingest
from aerealith_core.shards import tokenize
from aerealith_core.tokenizer import train_tokenizer


@pytest.fixture
def corpus(tmp_path):
    raw, processed, tokenizer, shards = (
        tmp_path / n for n in ("raw", "processed", "tokenizer.json", "shards")
    )
    raw.mkdir()
    (raw / "a.txt").write_text("Hello Aerealith. " * 40)
    (raw / "b.jsonl").write_text('{"key":"Useful training data for our own model."}\n')
    ingest(raw, processed, PreprocessConfig(min_chars=1))
    train_tokenizer(processed, tokenizer, TokenizerConfig(vocab_size=260))
    tokenize(
        processed,
        shards,
        tokenizer,
        TokenizeConfig(tokens_per_shard=32, sequence_length=8),
    )
    return raw, processed, tokenizer, shards
