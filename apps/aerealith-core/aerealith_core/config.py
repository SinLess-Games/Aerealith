# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Validated, JSON-serializable configuration. Unknown keys are errors."""

import json
import math
from dataclasses import asdict, dataclass, fields
from pathlib import Path
from typing import Literal, TypeVar

T = TypeVar("T")


def load_config(cls: type[T], path: str | Path | None) -> T:
    data = json.loads(Path(path).read_text()) if path else {}
    if not isinstance(data, dict):
        raise ValueError("Configuration must be a JSON object")
    allowed = {f.name for f in fields(cls)}  # type: ignore[arg-type]
    if unknown := data.keys() - allowed:
        raise ValueError(f"Unknown configuration keys: {sorted(unknown)}")
    for field in fields(cls):  # type: ignore[arg-type]
        if field.name not in data:
            continue
        value = data[field.name]
        if field.type is int and (
            not isinstance(value, int) or isinstance(value, bool)
        ):
            raise ValueError(f"{field.name} must be an integer")
        if field.type is bool and not isinstance(value, bool):
            raise ValueError(f"{field.name} must be boolean")
        if field.type is str and not isinstance(value, str):
            raise ValueError(f"{field.name} must be a string")
        if field.type is float and (
            not isinstance(value, (int, float))
            or isinstance(value, bool)
            or not math.isfinite(value)
        ):
            raise ValueError(f"{field.name} must be a finite number")
    return cls(**data)


def positive(**values: int | float) -> None:
    for name, value in values.items():
        if isinstance(value, bool) or value <= 0 or not math.isfinite(value):
            raise ValueError(f"{name} must be positive and finite")


@dataclass(frozen=True)
class ModelConfig:
    vocab_size: int = 32768
    context_length: int = 8192
    layers: int = 24
    hidden_dim: int = 1024
    heads: int = 16
    kv_heads: int = 8
    intermediate_dim: int = 2816
    dropout: float = 0.0
    rope_theta: float = 10000.0
    norm_eps: float = 1e-6
    tied_embeddings: bool = True
    gradient_checkpointing: bool = False

    def __post_init__(self) -> None:
        positive(
            **{
                k: v
                for k, v in asdict(self).items()
                if k not in {"dropout", "tied_embeddings", "gradient_checkpointing"}
            }
        )
        if self.hidden_dim % self.heads or self.heads % self.kv_heads:
            raise ValueError("hidden_dim must divide heads; heads must divide kv_heads")
        if (self.hidden_dim // self.heads) % 2:
            raise ValueError("RoPE head dimension must be even")
        if not 0 <= self.dropout < 1:
            raise ValueError("dropout must be in [0, 1)")

    def parameter_count(self) -> int:
        d, f = self.hidden_dim, self.intermediate_dim
        kv = self.kv_heads * (d // self.heads)
        return (
            self.vocab_size * d * (1 if self.tied_embeddings else 2)
            + self.layers * (2 * d * d + 2 * d * kv + 3 * d * f + 2 * d)
            + d
        )


@dataclass(frozen=True)
class PreprocessConfig:
    min_chars: int = 20
    max_document_bytes: int = 8 * 1024 * 1024
    unicode_form: Literal["NFC", "NFKC", "NFD", "NFKD"] = "NFKC"
    min_printable_ratio: float = 0.9
    deduplicate: bool = True
    workers: int = 1

    def __post_init__(self) -> None:
        positive(max_document_bytes=self.max_document_bytes, workers=self.workers)
        if self.min_chars < 0 or not 0 <= self.min_printable_ratio <= 1:
            raise ValueError("Invalid quality thresholds")
        if self.unicode_form not in {"NFC", "NFKC", "NFD", "NFKD"}:
            raise ValueError("Invalid Unicode normalization form")


@dataclass(frozen=True)
class TokenizerConfig:
    vocab_size: int = 32768
    min_frequency: int = 2
    max_training_bytes: int = 268435456
    max_training_records: int = 100000
    special_tokens: tuple[str, ...] = ("<pad>", "<unk>", "<bos>", "<eos>")

    def __post_init__(self) -> None:
        positive(
            vocab_size=self.vocab_size,
            min_frequency=self.min_frequency,
            max_training_bytes=self.max_training_bytes,
            max_training_records=self.max_training_records,
        )
        if self.vocab_size < 260 or tuple(self.special_tokens) != (
            "<pad>",
            "<unk>",
            "<bos>",
            "<eos>",
        ):
            raise ValueError(
                "Byte BPE needs at least 260 tokens and canonical specials"
            )


@dataclass(frozen=True)
class TokenizeConfig:
    tokens_per_shard: int = 16777216
    sequence_length: int = 8192

    def __post_init__(self) -> None:
        positive(**asdict(self))


@dataclass(frozen=True)
class TrainConfig:
    model_config: str = "configs/model-312m.json"
    train_shards: str = "../../data/shards"
    validation_shards: str | None = None
    tokenizer: str = "../../data/tokenizer/tokenizer.json"
    output: str = "../../data/checkpoints"
    steps: int = 1000
    batch_size: int = 1
    accumulation_steps: int = 8
    sequence_length: int = 8192
    learning_rate: float = 0.0003
    min_lr_ratio: float = 0.1
    warmup_steps: int = 100
    weight_decay: float = 0.1
    gradient_clip: float = 1.0
    checkpoint_interval: int = 100
    validation_interval: int = 100
    validation_batches: int = 20
    workers: int = 0
    seed: int = 42
    precision: str = "auto"
    device: str = "auto"

    def __post_init__(self) -> None:
        positive(
            steps=self.steps,
            batch_size=self.batch_size,
            accumulation_steps=self.accumulation_steps,
            sequence_length=self.sequence_length,
            learning_rate=self.learning_rate,
            gradient_clip=self.gradient_clip,
            checkpoint_interval=self.checkpoint_interval,
            validation_interval=self.validation_interval,
            validation_batches=self.validation_batches,
        )
        if self.workers < 0 or self.warmup_steps < 0 or self.weight_decay < 0:
            raise ValueError("workers, warmup and weight decay cannot be negative")
        if self.precision not in {"auto", "fp32", "bf16", "fp16"}:
            raise ValueError("Unknown precision")
        if not 0 <= self.min_lr_ratio <= 1:
            raise ValueError("min_lr_ratio must be in [0, 1]")


@dataclass(frozen=True)
class EvaluationConfig:
    batches: int = 20
    batch_size: int = 1
    sequence_length: int = 8192

    def __post_init__(self) -> None:
        positive(**asdict(self))


@dataclass(frozen=True)
class GenerationConfig:
    max_new_tokens: int = 100
    temperature: float = 0.8
    top_k: int = 50
    top_p: float = 0.95
    repetition_penalty: float = 1.0
    seed: int = 42

    def __post_init__(self) -> None:
        positive(
            max_new_tokens=self.max_new_tokens,
            repetition_penalty=self.repetition_penalty,
        )
        if (
            not math.isfinite(self.temperature)
            or self.temperature < 0
            or self.top_k < 0
            or not 0 < self.top_p <= 1
        ):
            raise ValueError("Invalid sampling settings")
