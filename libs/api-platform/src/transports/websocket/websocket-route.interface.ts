import type { ApiRequestContext } from '../../context/api-request-context.interface';
import type { MaybePromise } from '../../context/api-context-factory.interface';
import type { WebSocketErrorMessage } from './websocket-error-message.interface';
import type { WebSocketMessage } from './websocket-message.interface';

export interface WebSocketConnection {
  readonly id: string;
  send(message: WebSocketMessage | WebSocketErrorMessage): void;
  close(code?: number, reason?: string): void;
}

export interface WebSocketValidationResult<TPayload> {
  readonly success: boolean;
  readonly data?: TPayload;
}

export interface WebSocketPayloadSchema<TPayload> {
  safeParse(value: unknown): WebSocketValidationResult<TPayload>;
}

export interface WebSocketRoute<
  TContext extends ApiRequestContext = ApiRequestContext,
  TPayload = unknown,
> {
  readonly path: string;
  readonly maxMessageBytes?: number;
  readonly heartbeat?: {
    readonly pingType?: string;
    readonly pongType?: string;
  };
  readonly schema?: WebSocketPayloadSchema<TPayload>;
  readonly authorize?: (context: TContext) => MaybePromise<boolean>;
  readonly onOpen?: (
    connection: WebSocketConnection,
    context: TContext,
  ) => MaybePromise<void>;
  readonly onMessage: (
    message: WebSocketMessage<TPayload>,
    connection: WebSocketConnection,
    context: TContext,
  ) => MaybePromise<void>;
  readonly onClose?: (
    connection: WebSocketConnection,
    context: TContext,
    code?: number,
    reason?: string,
  ) => MaybePromise<void>;
  readonly onError?: (
    error: unknown,
    connection: WebSocketConnection,
    context: TContext,
  ) => MaybePromise<void>;
}
