import { HttpStatus } from '@aerealith-ai/core';
import { upgradeWebSocket } from 'hono/cloudflare-workers';
import type { WSContext, WSMessageReceive } from 'hono/ws';

import type { ApiEnv } from '../../../app/api-env.type';
import type { ApiErrorResponse } from '../../../errors/api-error-response.interface';
import { ApiErrorCode } from '../../../errors/api-error-code.enum';
import type { WebSocketAdapter } from '../websocket-adapter.interface';
import { handleWebSocketMessage } from '../websocket-message-handler';
import type { WebSocketConnection } from '../websocket-route.interface';

/** Creates the Hono Cloudflare Workers WebSocket transport adapter. */
export function createCloudflareWebSocketAdapter<
  TEnv extends ApiEnv,
>(): WebSocketAdapter<TEnv> {
  return {
    register(app, route) {
      app.get(route.path, async (honoContext) => {
        const context = honoContext.get('apiContext');
        if (route.authorize && !(await route.authorize(context))) {
          return honoContext.json<ApiErrorResponse>(
            {
              error: {
                code: ApiErrorCode.Unauthorized,
                message: 'WebSocket authentication required.',
                requestId: context.requestId,
              },
            },
            HttpStatus.Unauthorized,
          );
        }

        const connectionId = crypto.randomUUID();
        context.logger.info({
          event: 'api.websocket.connection.opened',
          message: 'WebSocket connection opened.',
          component: 'api-platform',
          context: { connectionId, transport: 'websocket' },
        });
        return upgradeWebSocket(honoContext, {
          onMessage: async (event, socket) => {
            const source = await messageToString(event.data);
            const connection = toConnection(connectionId, socket);
            await handleWebSocketMessage(source, route, connection, context);
          },
          onClose: async (event, socket) => {
            const connection = toConnection(connectionId, socket);
            context.logger.info({
              event: 'api.websocket.connection.closed',
              message: 'WebSocket connection closed.',
              component: 'api-platform',
              context: {
                closeCode: event.code,
                connectionId,
                transport: 'websocket',
              },
            });
            await route.onClose?.(
              connection,
              context,
              event.code,
              event.reason,
            );
          },
          onError: async (event, socket) => {
            const connection = toConnection(connectionId, socket);
            context.logger.error({
              event: 'api.websocket.connection.failed',
              message: 'WebSocket connection failed.',
              component: 'api-platform',
              context: { connectionId, transport: 'websocket' },
            });
            await route.onError?.(event, connection, context);
            connection.close(1011, 'Connection error');
          },
        });
      });
    },
  };
}

function toConnection(id: string, socket: WSContext): WebSocketConnection {
  return {
    id,
    send(message) {
      socket.send(JSON.stringify(message));
    },
    close(code, reason) {
      socket.close(code, reason);
    },
  };
}

async function messageToString(message: WSMessageReceive): Promise<string> {
  if (typeof message === 'string') return message;
  if (message instanceof Blob) return message.text();
  if (message instanceof ArrayBuffer) {
    return new TextDecoder().decode(message);
  }
  return new TextDecoder().decode(new Uint8Array(message));
}
