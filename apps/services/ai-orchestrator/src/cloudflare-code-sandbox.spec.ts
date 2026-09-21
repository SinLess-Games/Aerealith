import type { AiCodeSandboxStub } from './bindings';
import { CloudflareCodeSandboxProvider } from './cloudflare-code-sandbox';

describe('CloudflareCodeSandboxProvider', () => {
  it('scopes file and command operations to the initialized repository root', async () => {
    const stub: AiCodeSandboxStub = {
      initialize: vi.fn(async () => ({
        root: '/workspace/repository',
      })),
      readFile: vi.fn(async () => 'content'),
      writeFile: vi.fn(async () => undefined),
      listFiles: vi.fn(async () => [
        'repository/src/index.ts',
        'repository/package.json',
      ]),
      search: vi.fn(async () => ['repository/src/index.ts']),
      execute: vi.fn(async () => ({
        exitCode: 0,
        stdout: 'ok',
        stderr: '',
        durationMs: 5,
      })),
      close: vi.fn(async () => undefined),
    };
    const getByName = vi.fn(() => stub);
    const provider = new CloudflareCodeSandboxProvider({ getByName });

    const session = await provider.create({
      repositoryUrl: 'https://github.com/example/repo.git',
      ref: 'main',
      workspaceId: 'tenant-workspace',
      networkAccess: true,
    });

    await expect(session.readFile('src/index.ts')).resolves.toBe('content');
    expect(stub.readFile).toHaveBeenCalledWith(
      '/workspace/repository/src/index.ts',
    );

    await expect(session.listFiles()).resolves.toEqual([
      'src/index.ts',
      'package.json',
    ]);

    await session.execute({
      command: 'pnpm',
      args: ['test'],
      limits: {
        timeoutMs: 60_000,
        networkAccess: true,
      },
    });

    expect(stub.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'pnpm',
        args: ['test'],
        cwd: '/workspace/repository',
        timeoutMs: 60_000,
        networkAccess: true,
      }),
    );

    await session.close();
    expect(stub.close).toHaveBeenCalledTimes(1);
    expect(getByName).toHaveBeenCalledWith('tenant-workspace');
  });
});
