import type { AiCodeSandboxStub } from './bindings';
import {
  executeToolRequest,
  ToolApprovalRequiredError,
} from './tool-runtime';

function createSandboxBinding() {
  const stub: AiCodeSandboxStub = {
    initialize: vi.fn(async () => ({ root: '/workspace' })),
    readFile: vi.fn(async () => 'hello'),
    writeFile: vi.fn(async () => undefined),
    listFiles: vi.fn(async () => ['src/index.ts']),
    search: vi.fn(async () => ['src/index.ts']),
    execute: vi.fn(async () => ({
      exitCode: 0,
      stdout: 'passed',
      stderr: '',
      durationMs: 10,
    })),
    close: vi.fn(async () => undefined),
  };
  const getByName = vi.fn(() => stub);

  return {
    binding: { getByName },
    stub,
    getByName,
  };
}

describe('sandbox tool runtime', () => {
  it('executes tenant-scoped read-only tools without approval', async () => {
    const { binding, stub, getByName } = createSandboxBinding();

    const result = await executeToolRequest(
      { AI_CODE_SANDBOX: binding },
      {
        capability: 'tool',
        tenantId: 'user-123',
        actorId: 'user-123',
        input: {
          name: 'sandbox.read_file',
          arguments: {
            workspaceId: 'project-a',
            path: 'README.md',
          },
        },
      },
    );

    expect(result).toMatchObject({
      providerId: 'cloudflare-code-sandbox',
      modelId: 'sandbox-tools-v1',
      content: {
        output: 'hello',
      },
    });
    expect(getByName).toHaveBeenCalledWith(
      'user:user-123:tool:project-a',
    );
    expect(stub.readFile).toHaveBeenCalledWith('/workspace/README.md');
  });

  it('requires explicit approval for writes', async () => {
    const { binding } = createSandboxBinding();

    await expect(
      executeToolRequest(
        { AI_CODE_SANDBOX: binding },
        {
          capability: 'tool',
          tenantId: 'user-123',
          input: {
            name: 'sandbox.write_file',
            arguments: {
              workspaceId: 'project-a',
              path: 'src/index.ts',
              content: 'export {}',
            },
          },
        },
      ),
    ).rejects.toBeInstanceOf(ToolApprovalRequiredError);
  });

  it('executes approved allowlisted commands', async () => {
    const { binding, stub } = createSandboxBinding();

    const result = await executeToolRequest(
      { AI_CODE_SANDBOX: binding },
      {
        capability: 'tool',
        tenantId: 'user-123',
        metadata: { approved: 'true' },
        input: {
          name: 'sandbox.exec',
          arguments: {
            workspaceId: 'project-a',
            command: 'pnpm',
            args: ['test'],
            timeoutMs: 60_000,
          },
        },
      },
    );

    expect(result.content).toMatchObject({
      output: {
        exitCode: 0,
        stdout: 'passed',
      },
    });
    expect(stub.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'pnpm',
        args: ['test'],
      }),
    );
  });
});
