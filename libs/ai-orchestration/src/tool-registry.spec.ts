import { InMemoryToolRegistry } from './tool-registry';
import type { ToolCall, ToolExecutor, ToolResult } from './tools';

class TestTool implements ToolExecutor {
  readonly definition = {
    name: 'calculator',
    description: 'Runs a deterministic calculation.',
    inputSchema: { type: 'object' },
  };

  async execute(call: ToolCall): Promise<ToolResult> {
    return {
      callId: call.id,
      output: 42,
    };
  }
}

describe('InMemoryToolRegistry', () => {
  it('registers and lists tools deterministically', () => {
    const registry = new InMemoryToolRegistry();
    registry.register(new TestTool());

    expect(registry.get('calculator')).toBeDefined();
    expect(registry.list()).toEqual([
      expect.objectContaining({ name: 'calculator' }),
    ]);
  });

  it('rejects duplicate tool names', () => {
    const registry = new InMemoryToolRegistry();
    registry.register(new TestTool());

    expect(() => registry.register(new TestTool())).toThrow(
      'already registered',
    );
  });
});
