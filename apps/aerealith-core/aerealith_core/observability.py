# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""JSON events with numeric metrics; never emit document contents."""

import json
import logging
from typing import Any

logger = logging.getLogger("aerealith_core")


def event(name: str, **metrics: Any) -> None:
    logger.info(json.dumps({"event": name, **metrics}, sort_keys=True))


def configure_logging() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
