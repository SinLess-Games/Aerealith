export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  requiresApproval?: boolean;
};

export type ToolCall = {
  id: string;
  name: string;
  arguments: unknown;
};

export type ToolResult = {
  callId: string;
  output: unknown;
};

export interface ToolExecutor {
  definition: ToolDefinition;
  execute(call: ToolCall): Promise<ToolResult>;
}

export interface ToolRegistry {
  register(tool: ToolExecutor): void;
  get(name: string): ToolExecutor | undefined;
  list(): readonly ToolDefinition[];
}
