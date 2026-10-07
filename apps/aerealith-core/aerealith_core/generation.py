# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

from pathlib import Path

import torch

from .config import GenerationConfig
from .model import Transformer
from .tokenizer import inspect_tokenizer, load_tokenizer
from .training import load_model, seed_all, select_device


@torch.no_grad()
def generate_tokens(
    model: Transformer, tokens: torch.Tensor, config: GenerationConfig, eos_id: int = 3
) -> torch.Tensor:
    if tokens.ndim != 2 or tokens.shape[0] != 1 or tokens.shape[1] == 0:
        raise ValueError("Generation expects one nonempty prompt")
    model.eval()
    for _ in range(config.max_new_tokens):
        logits, _ = model(tokens[:, -model.config.context_length :])
        scores = logits[:, -1].float()
        if config.repetition_penalty != 1:
            used = tokens.unique()
            selected = scores[:, used]
            scores[:, used] = torch.where(
                selected < 0,
                selected * config.repetition_penalty,
                selected / config.repetition_penalty,
            )
        if config.temperature == 0:
            next_token = scores.argmax(-1, keepdim=True)
        else:
            scores /= config.temperature
            if config.top_k:
                boundary = scores.topk(min(config.top_k, scores.size(-1))).values[
                    :, -1:
                ]
                scores = scores.masked_fill(scores < boundary, -torch.inf)
            if config.top_p < 1:
                ordered, indices = scores.sort(descending=True)
                remove = ordered.softmax(-1).cumsum(-1) > config.top_p
                remove[:, 1:] = remove[:, :-1].clone()
                remove[:, 0] = False
                ordered = ordered.masked_fill(remove, -torch.inf)
                scores = torch.full_like(scores, -torch.inf).scatter(
                    1, indices, ordered
                )
            next_token = torch.multinomial(scores.softmax(-1), num_samples=1)
        tokens = torch.cat((tokens, next_token), dim=1)
        if next_token.item() == eos_id:
            break
    return tokens


def generate(
    checkpoint: Path,
    tokenizer_path: Path,
    prompt: str,
    config: GenerationConfig,
    device_name: str = "auto",
) -> str:
    seed_all(config.seed)
    device = select_device(device_name)
    model, state = load_model(checkpoint, device)
    if inspect_tokenizer(tokenizer_path) != state["tokenizer"]:
        raise ValueError("Checkpoint tokenizer mismatch")
    tokenizer = load_tokenizer(tokenizer_path)
    prompt_ids = [2, *tokenizer.encode(prompt).ids]
    result = generate_tokens(model, torch.tensor([prompt_ids], device=device), config)
    return tokenizer.decode(result[0].tolist(), skip_special_tokens=True)
