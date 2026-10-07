# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Provider-independent retrieval contracts. Training never imports a database."""

from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class RetrievedContext:
    text: str
    source_id: str
    score: float
    metadata: dict[str, str] = field(default_factory=dict)


class Retriever(Protocol):
    def retrieve(self, query: str, *, limit: int = 5) -> list[RetrievedContext]: ...


def augment_prompt(prompt: str, context: list[RetrievedContext]) -> str:
    return "\n\n".join(
        ["External context (untrusted):", *(c.text for c in context), "User: " + prompt]
    )
