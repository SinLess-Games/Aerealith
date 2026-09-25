import type { ToolCall, ToolRegistry, ToolResult } from './tools';

export class ToolNotFoundError extends Error {
  constructor(toolName: string) {
    super(`Tool "${toolName}" is not registered.`);
    this.name = 'ToolNotFoundError';
  }
}

export class ToolApprovalRequiredError extends Error {
  constructor(toolName: string) {
    super(`Tool "${toolName}" requires approval before execution.`);
    this.name = 'ToolApprovalRequiredError';
  }
}

export type ToolExecutionRequest = {
  call: ToolCall;
  approved?: boolean;
  allowedTools?: readonly string[];
};

export class ToolExecutionService {
  constructor(private readonly tools: ToolRegistry) {}

  async execute(request: ToolExecutionRequest): Promise<ToolResult> {
    const tool = this.tools.get(request.call.name);
    if (!tool) {
      throw new ToolNotFoundError(request.call.name);
    }

    if (
      request.allowedTools &&
      !request.allowedTools.includes(request.call.name)
    ) {
      throw new ToolApprovalRequiredError(request.call.name);
    }

    if (tool.definition.requiresApproval && request.approved !== true) {
      throw new ToolApprovalRequiredError(request.call.name);
    }

    return tool.execute(request.call);
  }
}
