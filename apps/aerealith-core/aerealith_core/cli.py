# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Command entry point. Relative config paths resolve against the current directory."""

import argparse
import json
from dataclasses import asdict, replace
from pathlib import Path

from .config import (
    EvaluationConfig,
    GenerationConfig,
    ModelConfig,
    PreprocessConfig,
    TokenizeConfig,
    TokenizerConfig,
    TrainConfig,
    load_config,
)
from .observability import configure_logging


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(prog="aerealith-core")
    commands = root.add_subparsers(dest="command", required=True)
    ingest = commands.add_parser("ingest")
    ingest.add_argument("--input", type=Path, required=True)
    ingest.add_argument("--output", type=Path, required=True)
    ingest.add_argument("--config")
    ingest.add_argument("--workers", type=int)
    ingest.add_argument("--resume", action="store_true")
    ingest.add_argument("--force", action="store_true")
    tokenizer = commands.add_parser("tokenizer")
    tokenizer_commands = tokenizer.add_subparsers(
        dest="tokenizer_command", required=True
    )
    tokenizer_train = tokenizer_commands.add_parser("train")
    tokenizer_train.add_argument("--input", type=Path, required=True)
    tokenizer_train.add_argument("--output", type=Path, required=True)
    tokenizer_train.add_argument("--config")
    tokenizer_inspect = tokenizer_commands.add_parser("inspect")
    tokenizer_inspect.add_argument("--tokenizer", type=Path, required=True)
    tokenize = commands.add_parser("tokenize")
    tokenize.add_argument("--input", type=Path, required=True)
    tokenize.add_argument("--output", type=Path, required=True)
    tokenize.add_argument("--tokenizer", type=Path, required=True)
    tokenize.add_argument("--config")
    tokenize.add_argument("--resume", action="store_true")
    tokenize.add_argument("--force", action="store_true")
    inspect = commands.add_parser("inspect")
    inspect.add_argument("--shards", type=Path, required=True)
    stats = commands.add_parser("stats")
    stats.add_argument("--shards", type=Path)
    stats.add_argument("--model-config")
    stats.add_argument("--target", type=float, default=20)
    stats.add_argument("--tokens-per-shard", type=int, default=16777216)
    train = commands.add_parser("train")
    train.add_argument("--config", required=True)
    train.add_argument("--resume", type=Path)
    evaluate = commands.add_parser("evaluate")
    evaluate.add_argument("--checkpoint", type=Path, required=True)
    evaluate.add_argument("--shards", type=Path, required=True)
    evaluate.add_argument("--config")
    evaluate.add_argument("--device", default="auto")
    generate = commands.add_parser("generate")
    generate.add_argument("--checkpoint", type=Path, required=True)
    generate.add_argument("--tokenizer", type=Path, required=True)
    generate.add_argument("--prompt", required=True)
    generate.add_argument("--config")
    generate.add_argument("--device", default="auto")
    for name, kind in (
        ("max-new-tokens", int),
        ("temperature", float),
        ("top-k", int),
        ("top-p", float),
        ("repetition-penalty", float),
        ("seed", int),
    ):
        generate.add_argument("--" + name, type=kind)
    return root


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    configure_logging()
    result: object
    if args.command == "ingest":
        from .data.pipeline import ingest

        config = load_config(PreprocessConfig, args.config)
        if args.workers is not None:
            config = replace(config, workers=args.workers)
        result = ingest(
            args.input, args.output, config, resume=args.resume, force=args.force
        )
    elif args.command == "tokenizer":
        from .tokenizer import inspect_tokenizer, train_tokenizer

        result = (
            train_tokenizer(
                args.input, args.output, load_config(TokenizerConfig, args.config)
            )
            if args.tokenizer_command == "train"
            else inspect_tokenizer(args.tokenizer)
        )
    elif args.command == "tokenize":
        from .shards import tokenize

        result = tokenize(
            args.input,
            args.output,
            args.tokenizer,
            load_config(TokenizeConfig, args.config),
            resume=args.resume,
            force=args.force,
        )
    elif args.command == "inspect":
        from .shards import shard_metadata

        result = shard_metadata(args.shards)
    elif args.command == "stats":
        import torch

        from .model import Transformer
        from .shards import shard_metadata, token_statistics

        model_config = load_config(ModelConfig, args.model_config)
        # Build real module shapes without allocating 1.2 GB just to count weights.
        with torch.device("meta"):
            model = Transformer(model_config)
        parameters = model.parameter_count()
        if parameters != model_config.parameter_count():
            raise ValueError("Analytical and actual parameter count differ")
        tokens = (
            sum(m["tokens"] for m in shard_metadata(args.shards)) if args.shards else 0
        )
        result = {
            **token_statistics(tokens, parameters, args.target, args.tokens_per_shard),
            "architecture": asdict(model_config),
        }
    elif args.command == "train":
        from .training import train

        result = train(load_config(TrainConfig, args.config), resume=args.resume)
    elif args.command == "evaluate":
        from .dataset import TokenDataset, reject_leakage
        from .training import evaluate, load_model, select_device

        evaluation_config = load_config(EvaluationConfig, args.config)
        device = select_device(args.device)
        model, state = load_model(args.checkpoint, device)
        dataset = TokenDataset(args.shards, evaluation_config.sequence_length)
        train_path = Path(state["train_config"]["train_shards"])
        if not train_path.exists():
            raise ValueError("Training manifest required to check evaluation leakage")
        reject_leakage(
            TokenDataset(train_path, evaluation_config.sequence_length), dataset
        )
        if state["tokenizer"] != dataset.tokenizer_identity:
            raise ValueError("Evaluation tokenizer mismatch")
        result = evaluate(model, dataset, evaluation_config, device)
    else:
        from .generation import generate

        generation_config = load_config(GenerationConfig, args.config)
        overrides = {
            name: getattr(args, name)
            for name in asdict(generation_config)
            if getattr(args, name) is not None
        }
        result = generate(
            args.checkpoint,
            args.tokenizer,
            args.prompt,
            replace(generation_config, **overrides),
            args.device,
        )
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 1 if isinstance(result, dict) and result.get("failures") else 0
