# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Local byte-level BPE with fixed PAD/UNK/BOS/EOS IDs 0/1/2/3."""

from pathlib import Path

from tokenizers import Tokenizer, decoders, models, pre_tokenizers, trainers

from .config import TokenizerConfig
from .data.pipeline import processed_records
from .io import atomic_json, atomic_path, checksum


def train_tokenizer(input_dir: Path, path: Path, config: TokenizerConfig) -> dict:
    tokenizer = Tokenizer(models.BPE(unk_token="<unk>"))
    tokenizer.pre_tokenizer = pre_tokenizers.ByteLevel(add_prefix_space=False)
    tokenizer.decoder = decoders.ByteLevel()
    trainer = trainers.BpeTrainer(
        vocab_size=config.vocab_size,
        min_frequency=config.min_frequency,
        special_tokens=list(config.special_tokens),
        initial_alphabet=pre_tokenizers.ByteLevel.alphabet(),
    )
    sample = {"bytes": 0, "records": 0}

    def training_texts():
        for record in processed_records(input_dir):
            remaining = config.max_training_bytes - sample["bytes"]
            if remaining <= 0 or sample["records"] >= config.max_training_records:
                break
            text = (
                record["text"]
                .encode("utf-8")[:remaining]
                .decode("utf-8", errors="ignore")
            )
            if text:
                sample["bytes"] += len(text.encode("utf-8"))
                sample["records"] += 1
                yield text

    # Rust may advance this iterator on a worker thread; initialize its DB there.
    tokenizer.train_from_iterator(training_texts(), trainer=trainer)
    if not sample["records"]:
        raise ValueError("Tokenizer training corpus is empty")
    with atomic_path(path) as temporary:
        tokenizer.save(str(temporary))
        Tokenizer.from_file(str(temporary))
    metadata = inspect_tokenizer(path)
    atomic_json(path.with_suffix(".meta.json"), {**metadata, "training_sample": sample})
    return metadata


def load_tokenizer(path: Path) -> Tokenizer:
    tokenizer = Tokenizer.from_file(str(path))
    for index, special in enumerate(("<pad>", "<unk>", "<bos>", "<eos>")):
        if tokenizer.token_to_id(special) != index:
            raise ValueError(
                "Tokenizer special token IDs do not match Aerealith contract"
            )
    return tokenizer


def inspect_tokenizer(path: Path) -> dict:
    tokenizer = load_tokenizer(path)
    return {
        "sha256": checksum(path),
        "vocab_size": tokenizer.get_vocab_size(),
        "implementation": "tokenizers-byte-bpe",
        "version": "1",
        "special_ids": {"pad": 0, "unk": 1, "bos": 2, "eos": 3},
    }
