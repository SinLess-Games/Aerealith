# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Memory-mapped token access across shard boundaries, no whole-corpus loading."""

from bisect import bisect_right
from collections import OrderedDict
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import Dataset

from .shards import shard_metadata


class TokenDataset(Dataset):
    def __init__(self, root: Path, sequence_length: int = 8192, *, verify: bool = True):
        if sequence_length <= 0:
            raise ValueError("sequence_length must be positive")
        self.root, self.sequence_length = root, sequence_length
        self.metadata = shard_metadata(root, verify=verify)
        self.ends: list[int] = []
        total = 0
        for meta in self.metadata:
            total += meta["tokens"]
            self.ends.append(total)
        self.total_tokens = total
        self.maps: OrderedDict[int, np.memmap] = OrderedDict()
        if not self.metadata or len(self) == 0:
            raise ValueError("Dataset has insufficient tokens for one sequence")
        identities = {m["tokenizer"]["sha256"] for m in self.metadata}
        if len(identities) != 1:
            raise ValueError("Mixed tokenizer identities")
        self.tokenizer_identity = self.metadata[0]["tokenizer"]

    def __len__(self) -> int:
        return max(0, (self.total_tokens - 1) // self.sequence_length)

    def _map(self, index: int) -> np.memmap:
        if index not in self.maps:
            meta = self.metadata[index]
            self.maps[index] = np.memmap(
                self.root / meta["file"], dtype=meta["dtype"], mode="r"
            )
            if len(self.maps) > 8:
                self.maps.popitem(last=False)
        self.maps.move_to_end(index)
        return self.maps[index]

    def __getitem__(self, index: int) -> tuple[torch.Tensor, torch.Tensor]:
        if not 0 <= index < len(self):
            raise IndexError(index)
        start = index * self.sequence_length
        remaining = self.sequence_length + 1
        pieces = []
        while remaining:
            shard = bisect_right(self.ends, start)
            previous = self.ends[shard - 1] if shard else 0
            offset = start - previous
            count = min(remaining, self.ends[shard] - start)
            pieces.append(
                np.array(self._map(shard)[offset : offset + count], dtype=np.int64)
            )
            remaining -= count
            start += count
        tokens = torch.from_numpy(np.concatenate(pieces))
        return tokens[:-1], tokens[1:]

    def __getstate__(self):
        state = self.__dict__.copy()
        state["maps"] = OrderedDict()
        return state


def reject_leakage(training: TokenDataset, validation: TokenDataset) -> None:
    if training.root.resolve() == validation.root.resolve():
        raise ValueError("Training and validation directories must differ")
    train_hashes = {m["sha256"] for m in training.metadata}
    if train_hashes & {m["sha256"] for m in validation.metadata}:
        raise ValueError("Training/validation shard overlap")
    # Catch document overlap even when documents are packed into different shards.
    import sqlite3

    with sqlite3.connect(
        f"file:{training.root.resolve() / 'manifest.sqlite'}?mode=ro", uri=True
    ) as db:
        train_input = __import__("json").loads(
            db.execute("SELECT config FROM settings WHERE id=1").fetchone()[0]
        )["input"]
    with sqlite3.connect(
        f"file:{validation.root.resolve() / 'manifest.sqlite'}?mode=ro", uri=True
    ) as db:
        val_input = __import__("json").loads(
            db.execute("SELECT config FROM settings WHERE id=1").fetchone()[0]
        )["input"]
    with sqlite3.connect(
        f"file:{Path(train_input) / 'manifest.sqlite'}?mode=ro", uri=True
    ) as db:
        db.execute(
            "ATTACH DATABASE ? AS validation",
            (f"file:{Path(val_input) / 'manifest.sqlite'}?mode=ro",),
        )
        overlap = db.execute(
            "SELECT 1 FROM hashes JOIN validation.hashes USING(hash) LIMIT 1"
        ).fetchone()
        if overlap:
            raise ValueError("Training/validation document overlap")
