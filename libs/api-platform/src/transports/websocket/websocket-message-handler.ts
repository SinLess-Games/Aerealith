import { HttpStatus } from '@aerealith-ai/core';

import type { ApiRequestContext } from '../../context/api-request-context.interface';
import { ApiError } from '../../errors/api-error';
import { ApiErrorCode } from '../../errors/api-error-code.enum';
import { normalizeApiError } from '../../errors/normalize-api-error';
import type { WebSocketErrorMessage } from './websocket-error-message.interface';
import type { WebSocketMessage } from './websocket-message.interface';
import type {
  WebSocketConnection,
  WebSocketRoute,
} from './websocket-route.interface';

const DEFAULT_MAX_MESSAGE_BYTES = 64 * 1024;

/** Parses, validates, and dispatches one WebSocket message safely. */
export async function handleWebSocketMessage<
  TContext extends ApiRequestContext,
  TPayload,
>(
  source: string,
  route: WebSocketRoute<TContext, TPayload>,
  connection: WebSocketConnection,
  context: TContext,
): Promise<void> {
  let messageId: string | undefined;
  try {
    const bytes = new TextEncoder().encode(source).byteLength;
    if (bytes > (route.maxMessageBytes ?? DEFAULT_MAX_MESSAGE_BYTES)) {
      throw new ApiError('WebSocket message is too large.', {
        code: ApiErrorCode.BadRequest,
        status: HttpStatus.BadRequest,
      });
    }

    const parsed = parseMessage(source);
    if (!isMessage(parsed)) {
      throw new ApiError('Invalid WebSocket message envelope.', {
        code: ApiErrorCode.ValidationFailed,
        status: HttpStatus.BadRequest,
      });
    }
    messageId = parsed.id;
    if (
      route.heartbeat &&
      parsed.type === (route.heartbeat.pingType ?? 'ping')
    ) {
      connection.send({
        version: 1,
        type: route.heartbeat.pongType ?? 'pong',
        ...(parsed.id ? { id: parsed.id } : {}),
        payload: null,
      });
      return;
    }
    const validation = route.schema?.safeParse(parsed.payload);
    if (validation && (!validation.success || validation.data === undefined)) {
      throw new ApiError('Invalid WebSocket message payload.', {
        code: ApiErrorCode.ValidationFailed,
        status: HttpStatus.BadRequest,
      });
    }

    const message = {
      ...parsed,
      payload: validation?.data ?? parsed.payload,
    } as WebSocketMessage<TPayload>;
    context.logger.debug({
      event: 'api.websocket.message.received',
      message: 'WebSocket message received.',
      component: 'api-platform',
      context: {
        connectionId: connection.id,
        messageType: message.type,
        transport: 'websocket',
      },
    });
    await route.onMessage(message, connection, context);
  } catch (error) {
    const normalized = normalizeApiError(error);
    context.logger.warn({
      event: 'api.websocket.message.rejected',
      message: 'WebSocket message rejected.',
      component: 'api-platform',
      error: normalized.originalCause,
      context: {
        code: normalized.code,
        connectionId: connection.id,
        transport: 'websocket',
      },
    });
    connection.send(
      toWebSocketError(normalized.code, normalized.message, messageId),
    );
    await route.onError?.(error, connection, context);
  }
}

function parseMessage(source: string): unknown {
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new ApiError('Invalid WebSocket JSON.', {
      code: ApiErrorCode.BadRequest,
      status: HttpStatus.BadRequest,
      cause: error,
    });
  }
}

function isMessage(value: unknown): value is WebSocketMessage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate['version'] === 1 &&
    typeof candidate['type'] === 'string' &&
    'payload' in candidate &&
    (candidate['id'] === undefined || typeof candidate['id'] === 'string')
  );
}

function toWebSocketError(
  code: string,
  message: string,
  id?: string,
): WebSocketErrorMessage {
  return {
    version: 1,
    type: 'error',
    ...(id ? { id } : {}),
    error: { code, message },
  };
}
