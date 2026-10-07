# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Single-device training with deterministic sample position and atomic checkpoints."""

import hashlib
import json
import math
import random
import time
from collections.abc import Iterator
from contextlib import nullcontext
from dataclasses import asdict
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader, Sampler

from .config import EvaluationConfig, ModelConfig, TrainConfig, load_config
from .dataset import TokenDataset, reject_leakage
from .io import atomic_path
from .model import Transformer
from .observability import event
from .tokenizer import inspect_tokenizer


def seed_all(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True


class ResumableBatchSampler(Sampler[list[int]]):
    """O(1) bijective affine shuffle per epoch; position is batches consumed.

    Independent of DataLoader prefetch and worker count. This trades the randomness
    of a full permutation for bounded memory on corpora with millions of sequences.
    """

    def __init__(self, size: int, batch_size: int, seed: int, start: int = 0):
        self.size, self.batch_size, self.seed, self.start = (
            size,
            batch_size,
            seed,
            start,
        )

    def __iter__(self) -> Iterator[list[int]]:
        position = self.start * self.batch_size
        while True:
            batch = []
            for _ in range(self.batch_size):
                epoch, index = divmod(position, self.size)
                rng = random.Random(self.seed + epoch)
                multiplier = rng.randrange(1, self.size + 1)
                while math.gcd(multiplier, self.size) != 1:
                    multiplier = multiplier % self.size + 1
                offset = rng.randrange(self.size)
                batch.append((multiplier * index + offset) % self.size)
                position += 1
            yield batch


def select_device(name: str = "auto") -> torch.device:
    return (
        torch.device("cuda" if torch.cuda.is_available() else "cpu")
        if name == "auto"
        else torch.device(name)
    )


def precision_context(device: torch.device, precision: str):
    if device.type != "cuda" or precision == "fp32":
        return nullcontext()
    dtype = (
        torch.bfloat16
        if precision == "bf16"
        or (precision == "auto" and torch.cuda.is_bf16_supported())
        else torch.float16
    )
    if dtype == torch.bfloat16 and not torch.cuda.is_bf16_supported():
        raise ValueError("BF16 requested on unsupported hardware")
    return torch.autocast("cuda", dtype=dtype)


def rng_state() -> dict:
    np_state = np.random.get_state(legacy=True)
    assert isinstance(np_state, tuple)
    return {
        "python": random.getstate(),
        "numpy": (np_state[0], np_state[1].tolist(), *np_state[2:]),
        "torch": torch.get_rng_state(),
        "cuda": torch.cuda.get_rng_state_all() if torch.cuda.is_available() else [],
    }


def restore_rng(state: dict) -> None:
    random.setstate(state["python"])
    np_state = state["numpy"]
    np.random.set_state(
        (np_state[0], np.array(np_state[1], dtype=np.uint32), *np_state[2:])
    )
    torch.set_rng_state(state["torch"].cpu())
    if state["cuda"] and torch.cuda.is_available():
        torch.cuda.set_rng_state_all([r.cpu() for r in state["cuda"]])


def save_checkpoint(
    path: Path,
    model: Transformer,
    optimizer,
    scheduler,
    scaler,
    *,
    step: int,
    tokens_seen: int,
    batches_seen: int,
    train_config: TrainConfig,
    tokenizer: dict,
    dataset_identity: str,
) -> None:
    state = {
        "version": 1,
        "model": model.state_dict(),
        "optimizer": optimizer.state_dict(),
        "scheduler": scheduler.state_dict(),
        "scaler": scaler.state_dict(),
        "step": step,
        "tokens_seen": tokens_seen,
        "batches_seen": batches_seen,
        "rng": rng_state(),
        "model_config": asdict(model.config),
        "train_config": asdict(train_config),
        "tokenizer": tokenizer,
        "dataset_identity": dataset_identity,
    }
    started = time.monotonic()
    with atomic_path(path) as temporary:
        torch.save(state, temporary)
        # Verify format before replacing the previous durable checkpoint.
        loaded = torch.load(temporary, map_location="cpu", weights_only=True, mmap=True)
        if loaded["step"] != step:
            raise ValueError("Checkpoint validation failed")
    event("checkpoint", step=step, seconds=time.monotonic() - started)


def load_model(path: Path, device: torch.device) -> tuple[Transformer, dict]:
    state = torch.load(path, map_location="cpu", weights_only=True)
    if state["version"] != 1:
        raise ValueError("Unsupported checkpoint version")
    model = Transformer(ModelConfig(**state["model_config"]))
    model.load_state_dict(state["model"])
    model.to(device)
    return model, state


@torch.no_grad()
def evaluate(
    model: Transformer,
    dataset: TokenDataset,
    config: EvaluationConfig,
    device: torch.device,
) -> dict:
    if (
        config.sequence_length > model.config.context_length
        or dataset.sequence_length != config.sequence_length
    ):
        raise ValueError("Evaluation context mismatch")
    previous_mode = model.training
    model.eval()
    total_loss = 0.0
    tokens = correct = 0
    loader = DataLoader(
        dataset,
        batch_size=config.batch_size,
        shuffle=False,
        generator=torch.Generator().manual_seed(0),
    )
    try:
        for batch_index, (inputs, targets) in enumerate(loader):
            if batch_index >= config.batches:
                break
            inputs, targets = inputs.to(device), targets.to(device)
            logits, loss = model(inputs, targets)
            assert loss is not None
            total_loss += loss.item() * targets.numel()
            tokens += targets.numel()
            correct += (logits.argmax(-1) == targets).sum().item()
    finally:
        model.train(previous_mode)
    if not tokens:
        raise ValueError("No evaluation tokens")
    mean = total_loss / tokens
    return {
        "loss": mean,
        "perplexity": math.exp(min(mean, 80)),
        "tokens": tokens,
        "token_accuracy": correct / tokens,
    }


def train(config: TrainConfig, *, resume: Path | None = None) -> dict:
    seed_all(config.seed)
    model_config = load_config(ModelConfig, config.model_config)
    if config.sequence_length > model_config.context_length:
        raise ValueError("Training sequence exceeds model context")
    tokenizer = inspect_tokenizer(Path(config.tokenizer))
    if tokenizer["vocab_size"] != model_config.vocab_size:
        raise ValueError("Model vocabulary must equal actual tokenizer vocabulary")
    dataset = TokenDataset(Path(config.train_shards), config.sequence_length)
    if dataset.tokenizer_identity != tokenizer:
        raise ValueError("Training shards use a different tokenizer")
    identity = hashlib.sha256(
        json.dumps(dataset.metadata, sort_keys=True).encode()
    ).hexdigest()
    validation = (
        TokenDataset(Path(config.validation_shards), config.sequence_length)
        if config.validation_shards
        else None
    )
    if validation:
        reject_leakage(dataset, validation)
        if validation.tokenizer_identity != tokenizer:
            raise ValueError("Validation tokenizer mismatch")
    device = select_device(config.device)
    model = Transformer(model_config).to(device)
    event(
        "model",
        parameters=model.parameter_count(),
        context_length=model_config.context_length,
        training_tokens=dataset.total_tokens,
        tokens_per_parameter=dataset.total_tokens / model.parameter_count(),
        effective_batch_size=config.batch_size * config.accumulation_steps,
    )
    optimizer = torch.optim.AdamW(
        model.parameters(), lr=config.learning_rate, weight_decay=config.weight_decay
    )

    def lr_factor(step: int) -> float:
        if step < config.warmup_steps:
            return (step + 1) / max(1, config.warmup_steps)
        progress = min(
            1.0,
            (step - config.warmup_steps) / max(1, config.steps - config.warmup_steps),
        )
        return (
            config.min_lr_ratio
            + (1 - config.min_lr_ratio) * (1 + math.cos(math.pi * progress)) / 2
        )

    scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lr_factor)
    fp16 = device.type == "cuda" and (
        config.precision == "fp16"
        or (config.precision == "auto" and not torch.cuda.is_bf16_supported())
    )
    scaler = torch.amp.GradScaler("cuda", enabled=fp16)
    step = tokens_seen = batches_seen = 0
    state = None
    if resume:
        state = torch.load(resume, map_location="cpu", weights_only=True)
        if (
            state["model_config"] != asdict(model_config)
            or state["tokenizer"] != tokenizer
            or state["dataset_identity"] != identity
        ):
            raise ValueError("Checkpoint model/tokenizer/dataset identity mismatch")
        current, previous = asdict(config), state["train_config"].copy()
        # Moving artifacts and changing worker count/device does not change sample order.
        for key in ("output", "workers", "device"):
            current.pop(key)
            previous.pop(key)
        if current != previous:
            raise ValueError(
                "Resume configuration changed; schedule and data settings must match"
            )
        model.load_state_dict(state["model"])
        optimizer.load_state_dict(state["optimizer"])
        scheduler.load_state_dict(state["scheduler"])
        scaler.load_state_dict(state["scaler"])
        step, tokens_seen, batches_seen = (
            state["step"],
            state["tokens_seen"],
            state["batches_seen"],
        )
    sampler = ResumableBatchSampler(
        len(dataset), config.batch_size, config.seed, batches_seen
    )
    loader = DataLoader(
        dataset,
        batch_sampler=sampler,
        num_workers=config.workers,
        pin_memory=device.type == "cuda",
        multiprocessing_context="spawn" if config.workers else None,
        generator=torch.Generator().manual_seed(config.seed),
    )
    iterator = iter(loader)
    if state:
        restore_rng(state["rng"])
    checkpoint_path = Path(config.output) / "latest.pt"
    model.train()
    loss_value = None
    for step_index in range(step, config.steps):
        started = time.monotonic()
        optimizer.zero_grad(set_to_none=True)
        loss_value = 0.0
        step_tokens = 0
        for _ in range(config.accumulation_steps):
            inputs, targets = next(iterator)
            inputs, targets = inputs.to(device), targets.to(device)
            with precision_context(device, config.precision):
                _, loss = model(inputs, targets)
                assert loss is not None
                if not torch.isfinite(loss):
                    raise FloatingPointError("Non-finite training loss")
                scaled_loss = loss / config.accumulation_steps
            scaler.scale(scaled_loss).backward()
            loss_value += loss.item() / config.accumulation_steps
            step_tokens += targets.numel()
            batches_seen += 1
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(
            model.parameters(), config.gradient_clip, error_if_nonfinite=True
        )
        scaler.step(optimizer)
        scaler.update()
        scheduler.step()
        tokens_seen += step_tokens
        step = step_index + 1
        if device.type == "cuda":
            torch.cuda.synchronize()
        duration = time.monotonic() - started
        event(
            "training_step",
            step=step,
            loss=loss_value,
            perplexity=math.exp(min(loss_value, 80)),
            learning_rate=optimizer.param_groups[0]["lr"],
            tokens_seen=tokens_seen,
            tokens_per_second=step_tokens / duration,
            seconds=duration,
            gpu_memory_bytes=torch.cuda.max_memory_allocated(device)
            if device.type == "cuda"
            else 0,
        )
        if validation and step % config.validation_interval == 0:
            event(
                "validation",
                step=step,
                **evaluate(
                    model,
                    validation,
                    EvaluationConfig(
                        config.validation_batches,
                        config.batch_size,
                        config.sequence_length,
                    ),
                    device,
                ),
            )
        if step % config.checkpoint_interval == 0 or step == config.steps:
            save_checkpoint(
                checkpoint_path,
                model,
                optimizer,
                scheduler,
                scaler,
                step=step,
                tokens_seen=tokens_seen,
                batches_seen=batches_seen,
                train_config=config,
                tokenizer=tokenizer,
                dataset_identity=identity,
            )
    return {
        "step": step,
        "tokens_seen": tokens_seen,
        "loss": loss_value,
        "checkpoint": str(checkpoint_path),
    }
