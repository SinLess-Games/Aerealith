export interface WebSocketMessage<TPayload = unknown> {
  readonly version: 1;
  readonly type: string;
  readonly id?: string;
  readonly payload: TPayload;
}
