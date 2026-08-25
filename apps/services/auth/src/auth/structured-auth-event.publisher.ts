import type { AuthEventPublisher } from '@aerealith-ai/auth';

/**
 * Runtime event boundary. It intentionally logs only event metadata; durable
 * audit delivery can replace this implementation without changing auth flows.
 */
export class StructuredAuthEventPublisher implements AuthEventPublisher {
  publish(event: Parameters<AuthEventPublisher['publish']>[0]): void {
    console.info(
      JSON.stringify({
        event: 'auth.security_event',
        authEvent: event.event,
        occurredAt: event.occurredAt.toISOString(),
        userId: event.userId,
        sessionId: event.sessionId,
        reason: event.reason,
      }),
    );
  }
}
