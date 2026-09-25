export class WorkflowEntrypoint<
  TEnv = unknown,
  TParams = unknown,
> {
  protected readonly env: TEnv;

  constructor(_ctx?: unknown, env?: TEnv) {
    this.env = env as TEnv;
  }
}

export class DurableObject<TEnv = unknown> {
  protected readonly ctx: {
    storage: {
      kv: {
        get<T>(key: string): T | undefined;
        put(key: string, value: unknown): void;
      };
    };
  };

  protected readonly env: TEnv;

  constructor(
    ctx: {
      storage: {
        kv: {
          get<T>(key: string): T | undefined;
          put(key: string, value: unknown): void;
        };
      };
    },
    env: TEnv,
  ) {
    this.ctx = ctx;
    this.env = env;
  }
}

export type WorkflowEvent<TParams> = {
  payload: TParams;
};

export type WorkflowStep = {
  do<T>(name: string, callback: () => Promise<T>): Promise<T>;
};
