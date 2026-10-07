# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Bias-free pre-normalized causal Transformer with RoPE and SwiGLU."""

import torch
from torch import nn
from torch.nn import functional as F
from torch.utils.checkpoint import checkpoint

from .config import ModelConfig


class RMSNorm(nn.Module):
    def __init__(self, dim: int, eps: float):
        super().__init__()
        self.weight = nn.Parameter(torch.ones(dim))
        self.eps = eps

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        normalized = x.float() * torch.rsqrt(
            x.float().pow(2).mean(-1, keepdim=True) + self.eps
        )
        return normalized.to(x.dtype) * self.weight


class RotaryEmbedding(nn.Module):
    frequencies: torch.Tensor

    def __init__(self, dim: int, theta: float):
        super().__init__()
        self.register_buffer(
            "frequencies",
            theta ** (-torch.arange(0, dim, 2).float() / dim),
            persistent=False,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        angles = torch.outer(
            torch.arange(x.size(-2), device=x.device).float(), self.frequencies.float()
        )
        cos, sin = angles.cos().to(x.dtype), angles.sin().to(x.dtype)
        even, odd = x[..., ::2], x[..., 1::2]
        return torch.stack(
            (even * cos - odd * sin, even * sin + odd * cos), dim=-1
        ).flatten(-2)


class Attention(nn.Module):
    def __init__(self, c: ModelConfig):
        super().__init__()
        self.heads, self.kv_heads = c.heads, c.kv_heads
        self.head_dim, self.dropout = c.hidden_dim // c.heads, c.dropout
        self.q = nn.Linear(c.hidden_dim, c.hidden_dim, bias=False)
        self.k = nn.Linear(c.hidden_dim, c.kv_heads * self.head_dim, bias=False)
        self.v = nn.Linear(c.hidden_dim, c.kv_heads * self.head_dim, bias=False)
        self.out = nn.Linear(c.hidden_dim, c.hidden_dim, bias=False)
        self.rope = RotaryEmbedding(self.head_dim, c.rope_theta)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, t, _ = x.shape
        q = self.rope(self.q(x).view(b, t, self.heads, self.head_dim).transpose(1, 2))
        k = self.rope(
            self.k(x).view(b, t, self.kv_heads, self.head_dim).transpose(1, 2)
        )
        v = self.v(x).view(b, t, self.kv_heads, self.head_dim).transpose(1, 2)
        # Explicit repeat works with CPU and older SDPA backends as well as CUDA.
        k = k.repeat_interleave(self.heads // self.kv_heads, dim=1)
        v = v.repeat_interleave(self.heads // self.kv_heads, dim=1)
        out = F.scaled_dot_product_attention(
            q, k, v, is_causal=True, dropout_p=self.dropout if self.training else 0.0
        )
        return self.out(out.transpose(1, 2).contiguous().view(b, t, -1))


class SwiGLU(nn.Module):
    def __init__(self, c: ModelConfig):
        super().__init__()
        self.gate = nn.Linear(c.hidden_dim, c.intermediate_dim, bias=False)
        self.up = nn.Linear(c.hidden_dim, c.intermediate_dim, bias=False)
        self.down = nn.Linear(c.intermediate_dim, c.hidden_dim, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.down(F.silu(self.gate(x)) * self.up(x))


class Block(nn.Module):
    def __init__(self, c: ModelConfig):
        super().__init__()
        self.attn_norm, self.ffn_norm = (
            RMSNorm(c.hidden_dim, c.norm_eps),
            RMSNorm(c.hidden_dim, c.norm_eps),
        )
        self.attention, self.ffn = Attention(c), SwiGLU(c)
        self.dropout = nn.Dropout(c.dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.dropout(self.attention(self.attn_norm(x)))
        return x + self.dropout(self.ffn(self.ffn_norm(x)))


class Transformer(nn.Module):
    def __init__(self, config: ModelConfig):
        super().__init__()
        self.config = config
        self.embedding = nn.Embedding(config.vocab_size, config.hidden_dim)
        self.blocks = nn.ModuleList(Block(config) for _ in range(config.layers))
        self.norm = RMSNorm(config.hidden_dim, config.norm_eps)
        self.output = nn.Linear(config.hidden_dim, config.vocab_size, bias=False)
        if config.tied_embeddings:
            self.output.weight = self.embedding.weight
        self.apply(self._initialize)

    @staticmethod
    def _initialize(module: nn.Module) -> None:
        if isinstance(module, (nn.Linear, nn.Embedding)):
            nn.init.normal_(module.weight, mean=0, std=0.02)

    def forward(
        self, tokens: torch.Tensor, targets: torch.Tensor | None = None
    ) -> tuple[torch.Tensor, torch.Tensor | None]:
        if tokens.ndim != 2 or not 0 < tokens.shape[1] <= self.config.context_length:
            raise ValueError(
                "Expected nonempty [batch, sequence] within context length"
            )
        x = self.embedding(tokens)
        for block in self.blocks:
            x = (
                checkpoint(block, x, use_reentrant=False)
                if self.training and self.config.gradient_checkpointing
                else block(x)
            )
        logits = self.output(self.norm(x))
        loss = (
            None
            if targets is None
            else F.cross_entropy(logits.float().flatten(0, 1), targets.flatten())
        )
        return logits, loss

    def parameter_count(self) -> int:
        return sum(p.numel() for p in self.parameters() if p.requires_grad)
