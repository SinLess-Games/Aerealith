from __future__ import annotations

from typing import Any


class AerealithError(Exception):
    """
    Base exception for all Aerealith Discord bot errors.

    All custom application exceptions should inherit from this class so they
    can be caught and handled consistently by the global error handler.
    """

    default_message = "An unexpected Aerealith Discord bot error occurred."

    def __init__(
        self,
        message: str | None = None,
        *,
        code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.message = message or self.default_message
        self.code = code
        self.details = details or {}

        super().__init__(self.message)

    def __str__(self) -> str:
        if self.code:
            return f"[{self.code}] {self.message}"

        return self.message

    def to_dict(self) -> dict[str, Any]:
        """
        Return a safe serializable representation of the exception.

        Useful for structured logs, RabbitMQ events, API responses, and
        internal error handling.
        """

        return {
            "type": self.__class__.__name__,
            "code": self.code,
            "message": self.message,
            "details": self.details,
        }

# =============================================================================
# Health / Runtime
# =============================================================================


class HealthCheckError(AerealithError):
    """Raised when a component health check fails."""

    default_message = "The component health check failed."


class StartupError(AerealithError):
    """Raised when the service cannot start successfully."""

    default_message = "The Discord bot failed to start."


class ShutdownError(AerealithError):
    """Raised when graceful shutdown encounters an error."""

    default_message = "The Discord bot encountered an error while shutting down."
