import type { AiCodeSandboxStub } from './bindings';
import { executeOrchestrationRequest } from './execution-runtime';

describe('sandboxed coding-agent runtime', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('plans edits, writes files, runs tests, and persists a patch artifact', async () => {
    const writes: Array<{ path: string; content: string }> = [];
    const stub: AiCodeSandboxStub = {
      initialize: vi.fn(async () => ({
        root: '/workspace/repository',
      })),
      readFile: vi.fn(async (path) =>
        path.endsWith('package.json')
          ? '{"scripts":{"test":"vitest run"}}'
          : 'export const before = true;\n',
      ),
      writeFile: vi.fn(async (path, content) => {
        writes.push({ path, content });
      }),
      listFiles: vi.fn(async () => [
        'repository/package.json',
        'repository/src/index.ts',
      ]),
      search: vi.fn(async () => []),
      execute: vi.fn(async (request) => {
        if (
          request.command === 'git' &&
          request.args?.[0] === 'add'
        ) {
          return {
            exitCode: 0,
            stdout: '',
            stderr: '',
            durationMs: 1,
          };
        }

        if (
          request.command === 'git' &&
          request.args?.[0] === 'diff' &&
          request.args?.[1] === '--name-only'
        ) {
          return {
            exitCode: 0,
            stdout: 'src/index.ts\n',
            stderr: '',
            durationMs: 1,
          };
        }

        if (
          request.command === 'git' &&
          request.args?.[0] === 'diff'
        ) {
          return {
            exitCode: 0,
            stdout:
              'diff --git a/src/index.ts b/src/index.ts\n+export const after = true;\n',
            stderr: '',
            durationMs: 1,
          };
        }

        if (request.command === 'pnpm') {
          return {
            exitCode: 0,
            stdout: 'Tests passed',
            stderr: '',
            durationMs: 20,
          };
        }

        throw new Error(
          `Unexpected sandbox command: ${request.command}`,
        );
      }),
      close: vi.fn(async () => undefined),
    };
    const getByName = vi.fn(() => stub);
    const bucket = {
      put: vi.fn(
        async (
          _key: string,
          body: ArrayBuffer | ReadableStream,
        ) => ({
          uploaded: new Date('2026-09-21T00:00:00.000Z'),
          size:
            body instanceof ArrayBuffer
              ? body.byteLength
              : 0,
        }),
      ),
    } as unknown as R2Bucket;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (
          String(input) ===
          'https://models.example.test/v1/chat/completions'
        ) {
          return Response.json({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    summary: 'Updated the implementation and tested it.',
                    files: [
                      {
                        path: 'src/index.ts',
                        content: 'export const after = true;\n',
                      },
                    ],
                    commands: [
                      {
                        command: 'pnpm',
                        args: ['test'],
                      },
                    ],
                  }),
                },
              },
            ],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 50,
              total_tokens: 150,
            },
          });
        }

        throw new Error(`Unexpected fetch: ${String(input)}`);
      }),
    );

    const result = await executeOrchestrationRequest(
      {
        AI_CODE_SANDBOX: { getByName },
        AI_ARTIFACTS: bucket,
        AI_PROVIDER_CATALOG: JSON.stringify([
          {
            id: 'primary',
            kind: 'openai-compatible',
            baseUrl: 'https://models.example.test/v1',
            models: [
              {
                id: 'code-model',
                capabilities: ['code'],
                priority: 100,
              },
            ],
          },
        ]),
      },
      {
        capability: 'code',
        tenantId: 'user-123',
        actorId: 'user-123',
        input: {
          mode: 'edit',
          instruction: 'Replace the old export.',
          repository: {
            url: 'https://github.com/example/repo.git',
            ref: 'main',
          },
        },
      },
      {
        runId: '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
      },
    );

    expect(getByName).toHaveBeenCalledWith(
      'user:user-123:run:5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
    );
    expect(writes).toEqual([
      {
        path: '/workspace/repository/src/index.ts',
        content: 'export const after = true;\n',
      },
    ]);
    expect(result).toMatchObject({
      providerId: 'primary',
      modelId: 'code-model',
      content: {
        summary: 'Updated the implementation and tested it.',
        changedFiles: ['src/index.ts'],
        testResults: {
          passed: true,
          command: 'pnpm test',
          stdout: 'Tests passed',
        },
        patchArtifact: {
          kind: 'code',
          contentType: 'text/x-diff; charset=utf-8',
        },
      },
      usage: {
        inputUnits: 100,
        outputUnits: 50,
        totalUnits: 150,
      },
    });
    expect(result.artifacts).toHaveLength(1);
    expect(stub.close).toHaveBeenCalledTimes(1);
  });
});
