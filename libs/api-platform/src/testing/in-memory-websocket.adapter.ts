import type { Hono } from 'hono';

import type { ApiEnv } from '../app/api-env.type';
import type { ApiRequestContext } from '../context/api-request-context.interface';
import type { WebSocketAdapter } from '../transports/websocket/websocket-adapter.interface';
import { handleWebSocketMessage } from '../transports/websocket/websocket-message-handler';
import type { WebSocketErrorMessage } from '../transports/websocket/websocket-error-message.interface';
import type { WebSocketMessage } from '../transports/websocket/websocket-message.interface';
import type {
  WebSocketConnection,
  WebSocketRoute,
} from '../transports/websocket/websocket-route.interface';

export class InMemoryWebSocketConnection<
  TContext extends ApiRequestContext,
> implements WebSocketConnection {
  readonly sent: (WebSocketMessage | WebSocketErrorMessage)[] = [];
  closed?: { code?: number; reason?: string };

  constructor(
    readonly id: string,
    private readonly route: WebSocketRoute<TContext, unknown>,
    private readonly context: TContext,
  ) {}

  send(message: WebSocketMessage | WebSocketErrorMessage): void {
    this.sent.push(message);
  }

  close(code?: number, reason?: string): void {
    this.closed = { code, reason };
  }

  receive(source: string): Promise<void> {
    return handleWebSocketMessage(source, this.route, this, this.context);
  }
}

/** Fake adapter that exercises route behavior without a runtime upgrader. */
export class InMemoryWebSocketAdapter<
  TEnv extends ApiEnv,
> implements WebSocketAdapter<TEnv> {
  private readonly routes = new Map<
    string,
    WebSocketRoute<TEnv['Variables']['apiContext'], unknown>
  >();

  register(
    app: Hono<TEnv>,
    route: WebSocketRoute<TEnv['Variables']['apiContext'], unknown>,
  ): void {
    this.routes.set(route.path, route);
    app.get(route.path, (context) =>
      context.json({ error: 'WebSocket upgrade required.' }, 426),
    );
  }

  async connect(
    path: string,
    context: TEnv['Variables']['apiContext'],
  ): Promise<InMemoryWebSocketConnection<TEnv['Variables']['apiContext']>> {
    const route = this.routes.get(path);
    if (!route) throw new Error(`No WebSocket route registered for ${path}.`);
    if (route.authorize && !(await route.authorize(context))) {
      throw new Error('WebSocket authentication rejected.');
    }
    const connection = new InMemoryWebSocketConnection(
      crypto.randomUUID(),
      route,
      context,
    );
    await route.onOpen?.(connection, context);
    return connection;
  }
}
