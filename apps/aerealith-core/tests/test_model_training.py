# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

import json
import math
from dataclasses import asdict
from pathlib import Path

import pytest
import torch

from aerealith_core.config import (
    EvaluationConfig,
    GenerationConfig,
    ModelConfig,
    PreprocessConfig,
    TokenizeConfig,
    TokenizerConfig,
    TrainConfig,
)
from aerealith_core.data.pipeline import ingest
from aerealith_core.dataset import TokenDataset
from aerealith_core.generation import generate, generate_tokens
from aerealith_core.model import Transformer
from aerealith_core.shards import token_statistics, tokenize
from aerealith_core.tokenizer import train_tokenizer
from aerealith_core.training import ResumableBatchSampler, evaluate, load_model, train


def tiny(**changes):
    return ModelConfig(
        **(
            {
                "vocab_size": 260,
                "context_length": 16,
                "layers": 2,
                "hidden_dim": 32,
                "heads": 4,
                "kv_heads": 2,
                "intermediate_dim": 64,
            }
            | changes
        )
    )


@pytest.mark.parametrize("tied,kv", [(True, 2), (False, 4)])
def test_parameter_count(tied, kv):
    config = tiny(tied_embeddings=tied, kv_heads=kv)
    assert Transformer(config).parameter_count() == config.parameter_count()
    with torch.device("meta"):
        default = Transformer(ModelConfig())
    assert default.parameter_count() == ModelConfig().parameter_count()
    assert abs(default.parameter_count() - 312656896) / 312656896 < 0.02


def test_forward_causal_and_gradient_checkpointing():
    torch.manual_seed(3)
    model = Transformer(tiny(gradient_checkpointing=True))
    inputs = torch.randint(0, 260, (2, 8))
    model.eval()
    original, _ = model(inputs)
    changed = inputs.clone()
    changed[:, 4:] = (changed[:, 4:] + 1) % 260
    perturbed, _ = model(changed)
    torch.testing.assert_close(original[:, :4], perturbed[:, :4])
    model.train()
    _, loss = model(inputs, inputs.roll(-1, 1))
    assert loss is not None and torch.isfinite(loss)
    loss.backward()
    assert all(p.grad is not None for p in model.parameters())
    with pytest.raises(ValueError):
        model(torch.ones((1, 17), dtype=torch.long))


def test_statistics():
    result = token_statistics(15000000000, 312656896, 25)
    assert result["tokens_per_parameter"] == pytest.approx(47.97591286775904, rel=1e-5)
    assert result["required_shards"] == math.ceil(312656896 * 25 / 16777216)
    with pytest.raises(ValueError):
        token_statistics(1, 0)


def test_sampler_resume():
    sampler = iter(ResumableBatchSampler(13, 2, 42))
    batches = [next(sampler) for _ in range(10)]
    resumed = iter(ResumableBatchSampler(13, 2, 42, start=7))
    assert [next(resumed) for _ in range(3)] == batches[7:]
    samples = iter(ResumableBatchSampler(13, 1, 42))
    assert len({next(samples)[0] for _ in range(13)}) == 13


def test_training_resume_evaluation_generation(tmp_path, monkeypatch):
    torch.set_num_threads(1)
    raw, processed, tokenizer, shards = (
        tmp_path / n for n in ("raw", "processed", "tokenizer.json", "shards")
    )
    raw.mkdir()
    (raw / "a.txt").write_text("Hello from our language model. " * 12)
    ingest(raw, processed, PreprocessConfig(min_chars=1))
    train_tokenizer(processed, tokenizer, TokenizerConfig(vocab_size=260))
    tokenize(processed, shards, tokenizer, TokenizeConfig(64, 8))
    model_config = tmp_path / "model.json"
    model_config.write_text(json.dumps(asdict(tiny(dropout=0.1))))
    config = TrainConfig(
        model_config=str(model_config),
        train_shards=str(shards),
        tokenizer=str(tokenizer),
        output=str(tmp_path / "checkpoints"),
        steps=3,
        batch_size=1,
        accumulation_steps=2,
        sequence_length=8,
        warmup_steps=1,
        checkpoint_interval=1,
    )
    import aerealith_core.training as module

    original = module.save_checkpoint

    def interrupted(*args, **kwargs):
        original(*args, **kwargs)
        if kwargs["step"] == 1:
            raise KeyboardInterrupt

    monkeypatch.setattr(module, "save_checkpoint", interrupted)
    with pytest.raises(KeyboardInterrupt):
        train(config)
    checkpoint = Path(config.output) / "latest.pt"
    state = torch.load(checkpoint, weights_only=True)
    assert state["step"] == 1 and state["tokens_seen"] == 16
    monkeypatch.setattr(module, "save_checkpoint", original)
    result = train(config, resume=checkpoint)
    assert result["step"] == 3 and result["tokens_seen"] == 48
    resumed, _ = load_model(checkpoint, torch.device("cpu"))
    reference = train(config)
    uninterrupted, state = load_model(
        Path(reference["checkpoint"]), torch.device("cpu")
    )
    for a, b in zip(resumed.parameters(), uninterrupted.parameters(), strict=True):
        torch.testing.assert_close(a, b, rtol=0, atol=0)
    metrics = evaluate(
        resumed, TokenDataset(shards, 8), EvaluationConfig(2, 1, 8), torch.device("cpu")
    )
    assert math.isfinite(metrics["loss"]) and metrics["tokens"] == 16
    text = generate(
        checkpoint,
        tokenizer,
        "Hello",
        GenerationConfig(max_new_tokens=3, temperature=0),
    )
    assert isinstance(text, str) and text.startswith("Hello")
    prompt = torch.tensor([[2, 4]])
    out = generate_tokens(
        resumed, prompt, GenerationConfig(max_new_tokens=2, temperature=0), eos_id=-1
    )
    assert out.shape == (1, 4)
    with pytest.raises(ValueError, match="configuration changed"):
        train(
            TrainConfig(**(asdict(config) | {"sequence_length": 4})), resume=checkpoint
        )
