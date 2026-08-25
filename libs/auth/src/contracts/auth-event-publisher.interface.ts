import type { LogContext } from '@aerealith-ai/core';

import type { AuthEvent } from '../enums/auth-event.enum';
import type { AuthFailureReason } from '../enums/auth-failure-reason.enum';

export interface AuthenticationEvent {
  readonly event: AuthEvent;
  readonly occurredAt: Date;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly reason?: AuthFailureReason;
  readonly context?: LogContext;
}

export interface AuthEventPublisher {
  publish(event: AuthenticationEvent): void | Promise<void>;
}
