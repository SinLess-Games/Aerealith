from __future__ import annotations

import asyncio
import logging
import sys
from datetime import datetime
from types import TracebackType
from typing import Any, Literal, Mapping, Self

import sentry_sdk
import structlog
from prometheus_client import (
    REGISTRY,
    CollectorRegistry,
    Counter,
    Gauge,
    Histogram,
)
from sentry_sdk.integrations.logging import LoggingIntegration


TRACE_LEVEL = 5

logging.addLevelName(TRACE_LEVEL, "TRACE")


class MetricsCollector:
    """
    Prometheus metrics collector for the Aerealith Discord bot.

    Instantiate this once per service/process.

    Do not use high-cardinality values such as guild_id, user_id,
    channel_id, interaction_id, or message_id as Prometheus labels.
    """

    def __init__(
        self,
        *,
        registry: CollectorRegistry = REGISTRY,
        namespace: str = "aerealith_discord",
    ) -> None:
        self.commands_total = Counter(
            "commands_total",
            "Total Discord commands processed.",
            ("command", "status"),
            namespace=namespace,
            registry=registry,
        )

        self.command_duration_seconds = Histogram(
            "command_duration_seconds",
            "Discord command execution duration in seconds.",
            ("command",),
            namespace=namespace,
            registry=registry,
        )

        self.gateway_events_total = Counter(
            "gateway_events_total",
            "Total Discord gateway events processed.",
            ("event",),
            namespace=namespace,
            registry=registry,
        )

        self.gateway_errors_total = Counter(
            "gateway_errors_total",
            "Total Discord gateway errors.",
            ("error_type",),
            namespace=namespace,
            registry=registry,
        )

        self.errors_total = Counter(
            "errors_total",
            "Total application errors.",
            ("component", "error_type"),
            namespace=namespace,
            registry=registry,
        )

        self.guilds = Gauge(
            "guilds",
            "Number of guilds currently available to this process.",
            namespace=namespace,
            registry=registry,
        )

        self.connected_shards = Gauge(
            "connected_shards",
            "Number of currently connected Discord shards.",
            namespace=namespace,
            registry=registry,
        )

        self.shard_latency_seconds = Gauge(
            "shard_latency_seconds",
            "Discord gateway latency by shard.",
            ("shard_id",),
            namespace=namespace,
            registry=registry,
        )

        self.active_voice_sessions = Gauge(
            "active_voice_sessions",
            "Number of active Discord voice sessions.",
            namespace=namespace,
            registry=registry,
        )

        self.active_music_players = Gauge(
            "active_music_players",
            "Number of active Lavalink/Mafic music players.",
            namespace=namespace,
            registry=registry,
        )

        self.music_tracks_total = Counter(
            "music_tracks_total",
            "Total music tracks processed.",
            ("status",),
            namespace=namespace,
            registry=registry,
        )

        self.ai_requests_total = Counter(
            "ai_requests_total",
            "Total AI requests.",
            ("operation", "status"),
            namespace=namespace,
            registry=registry,
        )

        self.ai_request_duration_seconds = Histogram(
            "ai_request_duration_seconds",
            "AI request duration in seconds.",
            ("operation",),
            namespace=namespace,
            registry=registry,
        )

        self.active_ai_voice_sessions = Gauge(
            "active_ai_voice_sessions",
            "Number of active realtime AI voice sessions.",
            namespace=namespace,
            registry=registry,
        )

        self.queue_jobs_total = Counter(
            "queue_jobs_total",
            "Total asynchronous queue jobs.",
            ("queue", "status"),
            namespace=namespace,
            registry=registry,
        )

        self.queue_job_duration_seconds = Histogram(
            "queue_job_duration_seconds",
            "Asynchronous queue job duration in seconds.",
            ("queue",),
            namespace=namespace,
            registry=registry,
        )

    def observe_command(
        self,
        command: str,
        *,
        status: str,
        duration_seconds: float,
    ) -> None:
        self.commands_total.labels(
            command=command,
            status=status,
        ).inc()

        self.command_duration_seconds.labels(
            command=command,
        ).observe(duration_seconds)

    def observe_gateway_event(self, event: str) -> None:
        self.gateway_events_total.labels(event=event).inc()

    def observe_error(
        self,
        component: str,
        error: BaseException,
    ) -> None:
        self.errors_total.labels(
            component=component,
            error_type=type(error).__name__,
        ).inc()

    def observe_ai_request(
        self,
        operation: str,
        *,
        status: str,
        duration_seconds: float,
    ) -> None:
        self.ai_requests_total.labels(
            operation=operation,
            status=status,
        ).inc()

        self.ai_request_duration_seconds.labels(
            operation=operation,
        ).observe(duration_seconds)

    def observe_queue_job(
        self,
        queue: str,
        *,
        status: str,
        duration_seconds: float,
    ) -> None:
        self.queue_jobs_total.labels(
            queue=queue,
            status=status,
        ).inc()

        self.queue_job_duration_seconds.labels(
            queue=queue,
        ).observe(duration_seconds)

    def set_guild_count(self, count: int) -> None:
        self.guilds.set(count)

    def set_connected_shards(self, count: int) -> None:
        self.connected_shards.set(count)

    def set_shard_latency(
        self,
        shard_id: int,
        latency_seconds: float,
    ) -> None:
        self.shard_latency_seconds.labels(
            shard_id=str(shard_id),
        ).set(latency_seconds)


class ErrorCollector:
    """
    Sentry error collector for the Aerealith Discord bot.
    """

    def __init__(
        self,
        *,
        dsn: str | None,
        environment: str,
        release: str | None = None,
        server_name: str | None = None,
        traces_sample_rate: float = 0.05,
        enabled: bool = True,
    ) -> None:
        self.enabled = bool(enabled and dsn)

        if not self.enabled:
            return

        logging_integration = LoggingIntegration(
            level=logging.INFO,
            # We explicitly send exceptions ourselves to avoid duplicates.
            event_level=None,
        )

        sentry_sdk.init(
            dsn=dsn,
            environment=environment,
            release=release,
            server_name=server_name,
            traces_sample_rate=traces_sample_rate,
            send_default_pii=False,
            integrations=[logging_integration],
        )

    def capture_exception(
        self,
        exception: BaseException,
        *,
        component: str | None = None,
        context: Mapping[str, Any] | None = None,
        tags: Mapping[str, str | int | float | bool] | None = None,
    ) -> str | None:
        if not self.enabled:
            return None

        with sentry_sdk.new_scope() as scope:
            if component:
                scope.set_tag("component", component)

            if tags:
                for key, value in tags.items():
                    scope.set_tag(key, value)

            if context:
                scope.set_context(
                    "aerealith",
                    _safe_mapping(context),
                )

            event_id = sentry_sdk.capture_exception(exception)

        return str(event_id) if event_id else None

    def capture_message(
        self,
        message: str,
        *,
        level: str = "info",
        component: str | None = None,
        context: Mapping[str, Any] | None = None,
    ) -> str | None:
        if not self.enabled:
            return None

        with sentry_sdk.new_scope() as scope:
            if component:
                scope.set_tag("component", component)

            if context:
                scope.set_context(
                    "aerealith",
                    _safe_mapping(context),
                )

            event_id = sentry_sdk.capture_message(
                message,
                level=level,
            )

        return str(event_id) if event_id else None

    def set_user(
        self,
        *,
        user_id: str | int | None = None,
        username: str | None = None,
    ) -> None:
        if not self.enabled:
            return

        user: dict[str, Any] = {}

        if user_id is not None:
            user["id"] = str(user_id)

        if username is not None:
            user["username"] = username

        sentry_sdk.set_user(user or None)

    def flush(self, timeout: float = 2.0) -> None:
        if self.enabled:
            sentry_sdk.flush(timeout=timeout)


class ErrorHandler:
    """
    Global error handler for the Aerealith Discord bot.

    Handles:
    - application exceptions
    - uncaught Python exceptions
    - asyncio event-loop exceptions
    - Prometheus error counters
    - Sentry reporting
    """

    def __init__(
        self,
        logger: Logger,
        *,
        errors: ErrorCollector | None = None,
        metrics: MetricsCollector | None = None,
    ) -> None:
        self.logger = logger
        self.errors = errors
        self.metrics = metrics

        self._previous_excepthook = sys.excepthook

    def handle(
        self,
        exception: BaseException,
        *,
        component: str = "unknown",
        event: str = "unhandled_exception",
        context: Mapping[str, Any] | None = None,
        reraise: bool = False,
    ) -> str | None:
        context_data = dict(context or {})

        self.logger.error(
            event,
            component=component,
            error_type=type(exception).__name__,
            error_message=str(exception),
            **context_data,
            exc_info=(
                type(exception),
                exception,
                exception.__traceback__,
            ),
        )

        if self.metrics is not None:
            self.metrics.observe_error(
                component,
                exception,
            )

        sentry_event_id: str | None = None

        if self.errors is not None:
            sentry_event_id = self.errors.capture_exception(
                exception,
                component=component,
                context=context_data,
            )

        if reraise:
            raise exception

        return sentry_event_id

    def install(self) -> None:
        """
        Install both the normal Python and asyncio global handlers.
        """

        self.install_sys_hook()

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return

        self.install_asyncio_handler(loop)

    def install_sys_hook(self) -> None:
        def excepthook(
            exception_type: type[BaseException],
            exception: BaseException,
            traceback: TracebackType | None,
        ) -> None:
            if issubclass(exception_type, KeyboardInterrupt):
                self._previous_excepthook(
                    exception_type,
                    exception,
                    traceback,
                )
                return

            self.handle(
                exception,
                component="python",
                event="uncaught_exception",
                context={
                    "exception_type": exception_type.__name__,
                },
            )

        sys.excepthook = excepthook

    def install_asyncio_handler(
        self,
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        def handler(
            event_loop: asyncio.AbstractEventLoop,
            context: dict[str, Any],
        ) -> None:
            exception = context.get("exception")

            if not isinstance(exception, BaseException):
                exception = RuntimeError(
                    str(
                        context.get(
                            "message",
                            "Unknown asyncio exception",
                        )
                    )
                )

            safe_context = {
                key: _safe_value(value)
                for key, value in context.items()
                if key != "exception"
            }

            self.handle(
                exception,
                component="asyncio",
                event="asyncio_exception",
                context=safe_context,
            )

        loop.set_exception_handler(handler)


class LogFormatter:
    """
    Formats human-readable console log messages.

    Format:

        {part} | {level} | {message} | {HH:mm} |
        {logger name} | {function name} | {line number}
    """

    reset = "\033[0m"

    red = "\033[31m"
    yellow = "\033[33m"
    green = "\033[32m"
    blue = "\033[34m"
    grey = "\033[90m"
    magenta = "\033[35m"

    bold = "\033[1m"
    italic = "\033[3m"
    underline = "\033[4m"

    levels = {
        "critical": red + bold,
        "error": red,
        "warning": yellow,
        "info": green,
        "debug": blue,
        "trace": grey,
    }

    reserved_fields = {
        "_from_structlog",
        "_record",
        "event",
        "timestamp",
        "level",
        "logger",
        "func_name",
        "lineno",
        "part",
        "service",
        "environment",
    }

    def __call__(
        self,
        logger: Any,
        method_name: str,
        event_dict: dict[str, Any],
    ) -> str:
        event = str(event_dict.get("event", ""))

        level = str(
            event_dict.get(
                "level",
                method_name,
            )
        ).lower()

        part = str(
            event_dict.get(
                "part",
                "discord-bot",
            )
        )

        logger_name = str(
            event_dict.get(
                "logger",
                "aerealith",
            )
        )

        function_name = str(
            event_dict.get(
                "func_name",
                "?",
            )
        )

        line_number = event_dict.get(
            "lineno",
            "?",
        )

        timestamp = self._format_timestamp(
            event_dict.get("timestamp"),
        )

        color = self.levels.get(
            level,
            self.magenta,
        )

        level_text = (
            f"{color}"
            f"{level.upper():<8}"
            f"{self.reset}"
        )

        message = (
            f"{part} | "
            f"{level_text} | "
            f"{event} | "
            f"{timestamp} | "
            f"{logger_name} | "
            f"{function_name} | "
            f"{line_number}"
        )

        extra = self._format_extra(event_dict)

        if extra:
            message += f" | {extra}"

        return message

    @staticmethod
    def _format_timestamp(
        value: Any,
    ) -> str:
        if not value:
            return datetime.now().strftime("%H:%M")

        try:
            text = str(value).replace(
                "Z",
                "+00:00",
            )

            parsed = datetime.fromisoformat(text)

            return parsed.strftime("%H:%M")

        except (ValueError, TypeError):
            return datetime.now().strftime("%H:%M")

    def _format_extra(
        self,
        event_dict: Mapping[str, Any],
    ) -> str:
        parts: list[str] = []

        for key in sorted(event_dict):
            if key in self.reserved_fields:
                continue

            value = event_dict[key]

            parts.append(
                f"{key}={value!r}"
            )

        return " ".join(parts)


class LogConverter:
    """
    Converts structured logs to either console or JSON output.

    JSON output is intended for:

        structlog
            -> stdout
            -> Grafana Alloy
            -> Loki
            -> Grafana
    """

    def __init__(
        self,
        mode: Literal["console", "json"] = "console",
    ) -> None:
        self.mode = mode

        self.console_renderer = LogFormatter()

        self.json_renderer = structlog.processors.JSONRenderer(
            sort_keys=True,
            ensure_ascii=False,
        )

    def __call__(
        self,
        logger: Any,
        method_name: str,
        event_dict: dict[str, Any],
    ) -> str:
        event_dict.pop(
            "_record",
            None,
        )

        event_dict.pop(
            "_from_structlog",
            None,
        )

        if self.mode == "json":
            return self.json_renderer(
                logger,
                method_name,
                event_dict,
            )

        return self.console_renderer(
            logger,
            method_name,
            event_dict,
        )


class Logger:
    """
    Structured logger for the Aerealith Discord bot.

    Development:

        Logger.configure(output="console")

    Production / Loki:

        Logger.configure(output="json")

    Loki should ingest the JSON stdout through Grafana Alloy.
    """

    _configured = False

    def __init__(
        self,
        name: str,
        *,
        part: str | None = None,
        **context: Any,
    ) -> None:
        self.name = name

        self._logger = structlog.get_logger(name).bind(
            part=part or name,
            **context,
        )

    @classmethod
    def configure(
        cls,
        *,
        output: Literal["console", "json"] = "console",
        level: int | str = logging.INFO,
        service: str = "discord-bot",
        environment: str = "development",
        force: bool = True,
    ) -> None:
        """
        Configure Python logging and structlog.

        Use JSON output in production so Grafana Alloy can send
        structured logs directly to Loki.
        """

        if isinstance(level, str):
            level = logging.getLevelName(
                level.upper()
            )

            if not isinstance(level, int):
                raise ValueError(
                    f"Unknown logging level: {level}"
                )

        logging.addLevelName(
            TRACE_LEVEL,
            "TRACE",
        )

        shared_processors = [
            structlog.contextvars.merge_contextvars,
            _StaticContextProcessor(
                service=service,
                environment=environment,
            ),
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(
                fmt="iso",
                utc=True,
                key="timestamp",
            ),
            structlog.processors.CallsiteParameterAdder(
                parameters={
                    structlog.processors.CallsiteParameter.FUNC_NAME,
                    structlog.processors.CallsiteParameter.LINENO,
                }
            ),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            _RedactSecretsProcessor(),
        ]

        formatter = structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=shared_processors,
            processors=[
                structlog.stdlib.ProcessorFormatter.remove_processors_meta,
                LogConverter(output),
            ],
        )

        handler = logging.StreamHandler(
            sys.stdout
        )

        handler.setFormatter(formatter)

        root_logger = logging.getLogger()

        if force:
            for existing_handler in list(
                root_logger.handlers
            ):
                root_logger.removeHandler(
                    existing_handler
                )

        root_logger.addHandler(handler)
        root_logger.setLevel(level)

        logging.captureWarnings(True)

        structlog.configure(
            processors=[
                *shared_processors,
                structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
            ],
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )

        cls._configured = True

    def bind(
        self,
        **context: Any,
    ) -> Self:
        clone = object.__new__(
            type(self)
        )

        clone.name = self.name
        clone._logger = self._logger.bind(
            **context
        )

        return clone

    def unbind(
        self,
        *keys: str,
    ) -> Self:
        clone = object.__new__(
            type(self)
        )

        clone.name = self.name
        clone._logger = self._logger.unbind(
            *keys
        )

        return clone

    def trace(
        self,
        event: str,
        **context: Any,
    ) -> None:
        self._logger.log(
            TRACE_LEVEL,
            event,
            **context,
        )

    def debug(
        self,
        event: str,
        **context: Any,
    ) -> None:
        self._logger.debug(
            event,
            **context,
        )

    def info(
        self,
        event: str,
        **context: Any,
    ) -> None:
        self._logger.info(
            event,
            **context,
        )

    def warning(
        self,
        event: str,
        **context: Any,
    ) -> None:
        self._logger.warning(
            event,
            **context,
        )

    def error(
        self,
        event: str,
        **context: Any,
    ) -> None:
        self._logger.error(
            event,
            **context,
        )

    def critical(
        self,
        event: str,
        **context: Any,
    ) -> None:
        self._logger.critical(
            event,
            **context,
        )

    def exception(
        self,
        event: str,
        **context: Any,
    ) -> None:
        self._logger.exception(
            event,
            **context,
        )


class _StaticContextProcessor:
    """
    Adds global service metadata to every log.
    """

    def __init__(
        self,
        *,
        service: str,
        environment: str,
    ) -> None:
        self.service = service
        self.environment = environment

    def __call__(
        self,
        logger: Any,
        method_name: str,
        event_dict: dict[str, Any],
    ) -> dict[str, Any]:
        event_dict.setdefault(
            "service",
            self.service,
        )

        event_dict.setdefault(
            "environment",
            self.environment,
        )

        return event_dict


class _RedactSecretsProcessor:
    """
    Prevents common secrets from accidentally being written to logs.
    """

    sensitive_terms = {
        "authorization",
        "bot_token",
        "cookie",
        "discord_token",
        "dsn",
        "password",
        "secret",
        "token",
        "api_key",
        "apikey",
        "access_token",
        "refresh_token",
    }

    def __call__(
        self,
        logger: Any,
        method_name: str,
        event_dict: dict[str, Any],
    ) -> dict[str, Any]:
        return _redact_mapping(event_dict)


def _redact_mapping(
    mapping: Mapping[str, Any],
) -> dict[str, Any]:
    output: dict[str, Any] = {}

    for key, value in mapping.items():
        normalized_key = key.lower()

        if any(
            sensitive in normalized_key
            for sensitive in _RedactSecretsProcessor.sensitive_terms
        ):
            output[key] = "[REDACTED]"
            continue

        if isinstance(value, Mapping):
            output[key] = _redact_mapping(
                value
            )

        elif isinstance(value, list):
            output[key] = [
                _redact_value(item)
                for item in value
            ]

        elif isinstance(value, tuple):
            output[key] = tuple(
                _redact_value(item)
                for item in value
            )

        else:
            output[key] = value

    return output


def _redact_value(
    value: Any,
) -> Any:
    if isinstance(value, Mapping):
        return _redact_mapping(value)

    if isinstance(value, list):
        return [
            _redact_value(item)
            for item in value
        ]

    if isinstance(value, tuple):
        return tuple(
            _redact_value(item)
            for item in value
        )

    return value


def _safe_value(
    value: Any,
) -> Any:
    if value is None:
        return None

    if isinstance(
        value,
        (
            str,
            int,
            float,
            bool,
        ),
    ):
        return value

    if isinstance(value, Mapping):
        return _safe_mapping(value)

    if isinstance(
        value,
        (list, tuple, set),
    ):
        return [
            _safe_value(item)
            for item in value
        ]

    return repr(value)


def _safe_mapping(
    mapping: Mapping[str, Any],
) -> dict[str, Any]:
    return {
        str(key): _safe_value(value)
        for key, value in mapping.items()
    }
