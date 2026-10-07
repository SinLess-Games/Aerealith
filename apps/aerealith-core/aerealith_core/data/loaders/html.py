# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

from collections.abc import Iterator
from html.parser import HTMLParser
from pathlib import Path

from .base import bounded_read, validate_text


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.ignored = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "nav", "noscript"}:
            self.ignored += 1
        if not self.ignored and tag in {"p", "div", "br", "li", "h1", "h2", "tr"}:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in {"script", "style", "nav", "noscript"} and self.ignored:
            self.ignored -= 1
        if not self.ignored:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.ignored:
            self.parts.append(data)


def load_html(path: Path, max_bytes: int) -> Iterator[str]:
    parser = TextExtractor()
    parser.feed(bounded_read(path, max_bytes))
    yield validate_text("".join(parser.parts), max_bytes)
