import { ToolExecutionService, ToolApprovalRequiredError } from './tool-execution-service';
import { InMemoryToolRegistry } from './tool-registry';
import type { ToolCall, ToolExecutor, ToolResult } from './tools';

class TestTool implements ToolExecutor {
  readonly execute = vi.fn(
    async (call: ToolCall): Promise<ToolResult> => ({
      callId: call.id,
      output: 'done',
    }),
  );

  constructor(
    readonly definition: {
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      requiresApproval?: boolean;
    },
  ) {}
}

describe('ToolExecutionService', () => {
  it('executes an allowed tool', async () => {
    const registry = new InMemoryToolRegistry();
    const tool = new TestTool({
      name: 'search',
      description: 'Searches a knowledge base.',
      inputSchema: { type: 'object' },
    });
    registry.register(tool);

    const service = new ToolExecutionService(registry);
    const result = await service.execute({
      call: {
        id: 'call-1',
        name: 'search',
        arguments: { query: 'hello' },
      },
      allowedTools: ['search'],
    });

    expect(result).toEqual({ callId: 'call-1', output: 'done' });
    expect(tool.execute).toHaveBeenCalledTimes(1);
  });

  it('requires explicit approval for sensitive tools', async () => {
    const registry = new InMemoryToolRegistry();
    const tool = new TestTool({
      name: 'repo-write',
      description: 'Writes files to a repository.',
      inputSchema: { type: 'object' },
      requiresApproval: true,
    });
    registry.register(tool);

    const service = new ToolExecutionService(registry);
    const request = {
      call: {
        id: 'call-2',
        name: 'repo-write',
        arguments: { path: 'README.md' },
      },
    };

    await expect(service.execute(request)).rejects.toBeInstanceOf(
      ToolApprovalRequiredError,
    );
    expect(tool.execute).not.toHaveBeenCalled();

    await expect(
      service.execute({ ...request, approved: true }),
    ).resolves.toEqual({ callId: 'call-2', output: 'done' });
  });

  it('blocks tools outside the per-run allowlist', async () => {
    const registry = new InMemoryToolRegistry();
    const tool = new TestTool({
      name: 'network',
      description: 'Calls an external service.',
      inputSchema: { type: 'object' },
    });
    registry.register(tool);

    const service = new ToolExecutionService(registry);

    await expect(
      service.execute({
        call: { id: 'call-3', name: 'network', arguments: {} },
        allowedTools: ['search'],
      }),
    ).rejects.toBeInstanceOf(ToolApprovalRequiredError);

    expect(tool.execute).not.toHaveBeenCalled();
  });
});
