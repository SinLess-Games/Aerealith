export interface WebSocketErrorMessage {
  readonly version: 1;
  readonly type: 'error';
  readonly id?: string;
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}
