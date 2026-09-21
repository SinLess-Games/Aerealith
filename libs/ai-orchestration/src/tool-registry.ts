import type {
  ToolDefinition,
  ToolExecutor,
  ToolRegistry,
} from './tools';

export class InMemoryToolRegistry implements ToolRegistry {
  private readonly tools = new Map<string, ToolExecutor>();

  register(tool: ToolExecutor): void {
    if (this.tools.has(tool.definition.name)) {
      throw new Error(
        `Tool "${tool.definition.name}" is already registered.`,
      );
    }

    this.tools.set(tool.definition.name, tool);
  }

  get(name: string): ToolExecutor | undefined {
    return this.tools.get(name);
  }

  list(): readonly ToolDefinition[] {
    return [...this.tools.values()]
      .map((tool) => tool.definition)
      .sort((left, right) => left.name.localeCompare(right.name));
  }
}
