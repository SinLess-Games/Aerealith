import { AiCodeSandbox } from './code-sandbox-container';

function createSandbox() {
  const start = vi.fn();
  const ctx = {
    container: {
      running: false,
      start,
      exec: vi.fn(),
      destroy: vi.fn(),
    },
    storage: {
      kv: {
        get: vi.fn(),
        put: vi.fn(),
      },
      setAlarm: vi.fn(),
      deleteAlarm: vi.fn(),
    },
  };

  return {
    sandbox: new AiCodeSandbox(ctx as never, {} as never),
    start,
  };
}

describe('AiCodeSandbox trust boundaries', () => {
  it('rejects non-GitHub repositories before enabling container networking', async () => {
    const { sandbox, start } = createSandbox();

    await expect(
      sandbox.initialize({
        repositoryUrl: 'https://example.com/owner/repo.git',
      }),
    ).rejects.toThrow(
      'Sandbox repositories must use credential-free HTTPS GitHub URLs.',
    );

    expect(start).not.toHaveBeenCalled();
  });

  it('rejects option-like or traversal-like repository refs before startup', async () => {
    const { sandbox, start } = createSandbox();

    await expect(
      sandbox.initialize({
        repositoryUrl: 'https://github.com/example/repo.git',
        ref: '--upload-pack=evil',
      }),
    ).rejects.toThrow('Sandbox repository ref is invalid.');

    await expect(
      sandbox.initialize({
        repositoryUrl: 'https://github.com/example/repo.git',
        ref: '../other',
      }),
    ).rejects.toThrow('Sandbox repository ref is invalid.');

    expect(start).not.toHaveBeenCalled();
  });

  it('rejects credentials embedded in GitHub URLs before startup', async () => {
    const { sandbox, start } = createSandbox();

    await expect(
      sandbox.initialize({
        repositoryUrl:
          'https://token:secret@github.com/example/repo.git',
      }),
    ).rejects.toThrow(
      'Sandbox repositories must use credential-free HTTPS GitHub URLs.',
    );

    expect(start).not.toHaveBeenCalled();
  });
});
