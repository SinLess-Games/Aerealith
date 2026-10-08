# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Extensible suffix registry. SQL and source code are inert text."""

from .base import Loader
from .html import load_html
from .pdf import load_pdf
from .raw import load_compressed, load_parquet
from .structured import load_csv, load_json, load_jsonl, load_xml, load_yaml
from .text import load_text

TEXT_EXTENSIONS = {
    ".txt",
    ".md",
    ".rst",
    ".sql",
    ".log",
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".c",
    ".h",
    ".cpp",
    ".hpp",
    ".cs",
    ".go",
    ".rs",
    ".rb",
    ".php",
    ".sh",
    ".bash",
    ".zsh",
    ".ps1",
    ".nix",
    ".toml",
    ".ini",
    ".conf",
    ".css",
    ".scss",
    ".graphql",
    ".proto",
    ".tf",
    ".hcl",
    ".dockerfile",
}
REGISTRY: dict[str, Loader] = dict.fromkeys(TEXT_EXTENSIONS, load_text)
REGISTRY.update(
    {
        ".csv": load_csv,
        ".tsv": load_csv,
        ".json": load_json,
        ".jsonl": load_jsonl,
        ".ndjson": load_jsonl,
        ".yaml": load_yaml,
        ".yml": load_yaml,
        ".xml": load_xml,
        ".html": load_html,
        ".htm": load_html,
        ".pdf": load_pdf,
        ".parquet": load_parquet,
        ".gz": load_compressed,
        ".bz2": load_compressed,
        ".zst": load_compressed,
        ".nt": load_text,
    }
)


def register_loader(extension: str, loader: Loader) -> None:
    REGISTRY[extension.lower()] = loader


def extension_for(path) -> str:
    return ".dockerfile" if path.name.lower() == "dockerfile" else path.suffix.lower()
