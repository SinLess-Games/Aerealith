# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

import os
from collections.abc import Iterator
from pathlib import Path


def discover(root: Path) -> Iterator[Path]:
    """Sorted per directory; no symlinks or recursive corpus-sized file list."""
    if not root.is_dir():
        raise ValueError("Input must be a directory")
    for directory, directories, files in os.walk(root, followlinks=False):
        directories[:] = sorted(
            d
            for d in directories
            if not (Path(directory) / d).is_symlink() and not d.startswith(".")
        )
        for name in sorted(files):
            path = Path(directory) / name
            if not path.is_symlink() and not name.startswith("."):
                yield path
