import { DurableObject } from 'cloudflare:workers';

import type { AiOrchestratorBindings } from './bindings';

const WORKSPACE_ROOT = '/workspace';
const REPOSITORY_ROOT = '/workspace/repository';
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_COMMAND_OUTPUT_BYTES = 4 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_TIMEOUT_MS = 15 * 60 * 1000;
const IDLE_TIMEOUT_MS = 20 * 60 * 1000;
const NETWORK_STATE_KEY = 'network-enabled';

type ContainerExecOutput = {
  stdout: ArrayBuffer;
  stderr: ArrayBuffer;
  exitCode: number;
};

type ContainerExecProcess = {
  stdin: WritableStream<Uint8Array> | null;
  pid: number;
  output(): Promise<ContainerExecOutput>;
  kill(signal?: number): void;
};

type LowLevelContainer = {
  running: boolean;
  start(options?: {
    env?: Record<string, string>;
    entrypoint?: string[];
    enableInternet?: boolean;
  }): void;
  exec(
    command: string[],
    options?: {
      stdin?: ReadableStream<Uint8Array> | 'pipe';
      stdout?: 'pipe' | 'ignore';
      stderr?: 'pipe' | 'ignore' | 'combined';
      cwd?: string;
      env?: Record<string, string>;
      user?: string;
    },
  ): Promise<ContainerExecProcess>;
  destroy(error?: string): Promise<void>;
};

export type SandboxCommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
};

export class AiCodeSandbox extends DurableObject<AiOrchestratorBindings> {
  private internetEnabled = false;

  async initialize(options: {
    repositoryUrl?: string;
    ref?: string;
    networkAccess?: boolean;
  } = {}): Promise<{ root: string }> {
    const networkAccess = options.networkAccess ?? Boolean(options.repositoryUrl);
    await this.ensureStarted(networkAccess);
    await this.touch();

    if (!options.repositoryUrl) {
      await this.run(['mkdir', '-p', WORKSPACE_ROOT], {
        timeoutMs: 30_000,
      });
      return { root: WORKSPACE_ROOT };
    }

    const repositoryUrl = validateRepositoryUrl(options.repositoryUrl);
    const existing = await this.run(
      ['test', '-d', `${REPOSITORY_ROOT}/.git`],
      { timeoutMs: 10_000 },
    );

    if (existing.exitCode !== 0) {
      const cloneArgs = [
        'git',
        'clone',
        '--depth',
        '1',
        ...(options.ref ? ['--branch', options.ref] : []),
        repositoryUrl,
        REPOSITORY_ROOT,
      ];

      const cloned = await this.run(cloneArgs, {
        cwd: WORKSPACE_ROOT,
        timeoutMs: 5 * 60 * 1000,
      });

      if (cloned.exitCode !== 0) {
        throw new Error(
          `Failed to clone repository: ${truncate(cloned.stderr, 4_000)}`,
        );
      }
    }

    return { root: REPOSITORY_ROOT };
  }

  async readFile(path: string): Promise<string> {
    await this.touch();
    const safePath = resolveWorkspacePath(path);
    const result = await this.run(['cat', safePath], {
      timeoutMs: 30_000,
    });

    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to read file: ${truncate(result.stderr, 2_000)}`,
      );
    }

    if (new TextEncoder().encode(result.stdout).byteLength > MAX_FILE_BYTES) {
      throw new Error('Sandbox file exceeds the 2 MiB read limit.');
    }

    await this.touch();
    return result.stdout;
  }

  async writeFile(path: string, content: string): Promise<void> {
    await this.touch();
    const bytes = new TextEncoder().encode(content);
    if (bytes.byteLength > MAX_FILE_BYTES) {
      throw new Error('Sandbox file exceeds the 2 MiB write limit.');
    }

    const safePath = resolveWorkspacePath(path);
    const parent = safePath.slice(0, Math.max(1, safePath.lastIndexOf('/')));
    await this.run(['mkdir', '-p', parent], { timeoutMs: 30_000 });

    const container = await this.container();
    const process = await container.exec(['tee', safePath], {
      stdin: 'pipe',
      stdout: 'ignore',
      stderr: 'pipe',
    });

    if (!process.stdin) {
      throw new Error('Sandbox process did not provide stdin.');
    }

    const writer = process.stdin.getWriter();
    await writer.write(bytes);
    await writer.close();
    const output = await process.output();

    if (output.exitCode !== 0) {
      throw new Error(
        `Failed to write file: ${decode(output.stderr)}`,
      );
    }

    await this.touch();
  }

  async listFiles(path = '.'): Promise<readonly string[]> {
    await this.touch();
    const safePath = resolveWorkspacePath(path);
    const result = await this.run(
      [
        'find',
        safePath,
        '-maxdepth',
        '6',
        '-type',
        'f',
        '-not',
        '-path',
        '*/node_modules/*',
        '-not',
        '-path',
        '*/.git/*',
        '-print',
      ],
      { timeoutMs: 30_000 },
    );

    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to list files: ${truncate(result.stderr, 2_000)}`,
      );
    }

    const files = result.stdout
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 2_000)
      .map(toWorkspaceRelativePath);

    await this.touch();
    return files;
  }

  async search(
    pattern: string,
    path = '.',
  ): Promise<readonly string[]> {
    await this.touch();

    if (!pattern || pattern.length > 1_024 || pattern.includes('\0')) {
      throw new Error('Sandbox search pattern is invalid.');
    }

    const safePath = resolveWorkspacePath(path);
    const result = await this.run(
      [
        'rg',
        '--files-with-matches',
        '--hidden',
        '--glob',
        '!node_modules/**',
        '--glob',
        '!.git/**',
        '--',
        pattern,
        safePath,
      ],
      { timeoutMs: 60_000 },
    );

    if (result.exitCode !== 0 && result.exitCode !== 1) {
      throw new Error(
        `Sandbox search failed: ${truncate(result.stderr, 2_000)}`,
      );
    }

    const matches = result.stdout
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 1_000)
      .map(toWorkspaceRelativePath);

    await this.touch();
    return matches;
  }

  async execute(request: {
    command: string;
    args?: readonly string[];
    cwd?: string;
    env?: Readonly<Record<string, string>>;
    timeoutMs?: number;
    networkAccess?: boolean;
  }): Promise<SandboxCommandResult> {
    if (!request.command || request.command.includes('\0')) {
      throw new Error('Sandbox command is invalid.');
    }

    await this.ensureStarted(request.networkAccess ?? this.internetEnabled);
    await this.touch();

    const result = await this.run(
      [request.command, ...(request.args ?? [])],
      {
        cwd: request.cwd
          ? resolveWorkspacePath(request.cwd)
          : undefined,
        env: sanitizeEnvironment(request.env),
        timeoutMs: request.timeoutMs,
      },
    );

    await this.touch();
    return result;
  }

  async close(): Promise<void> {
    await this.ctx.storage.deleteAlarm();

    const container = await this.container();
    if (container.running) {
      await container.destroy('Aerealith sandbox session closed');
    }

    this.internetEnabled = false;
    this.ctx.storage.kv.put(NETWORK_STATE_KEY, false);
  }

  async alarm(): Promise<void> {
    const container = await this.container();

    if (container.running) {
      await container.destroy('Aerealith sandbox idle timeout');
    }

    this.internetEnabled = false;
    this.ctx.storage.kv.put(NETWORK_STATE_KEY, false);
  }

  private async touch(): Promise<void> {
    await this.ctx.storage.setAlarm(Date.now() + IDLE_TIMEOUT_MS);
  }

  private async ensureStarted(enableInternet: boolean): Promise<void> {
    const container = await this.container();

    if (container.running) {
      const persistedNetworkState =
        this.ctx.storage.kv.get<boolean>(NETWORK_STATE_KEY) ?? false;
      this.internetEnabled = persistedNetworkState;

      if (enableInternet && !persistedNetworkState) {
        throw new Error(
          'Sandbox network access cannot be elevated after the container has started.',
        );
      }
      return;
    }

    this.internetEnabled = enableInternet;
    this.ctx.storage.kv.put(NETWORK_STATE_KEY, enableInternet);
    container.start({
      enableInternet,
      env: {
        HOME: '/workspace/home',
        CI: '1',
      },
    });

    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const probe = await container.exec(['true']);
        const output = await probe.output();
        if (output.exitCode === 0) return;
      } catch {
        // Container may still be booting.
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error('Sandbox container did not become ready in time.');
  }

  private async run(
    command: string[],
    options: {
      cwd?: string;
      env?: Record<string, string>;
      timeoutMs?: number;
    } = {},
  ): Promise<SandboxCommandResult> {
    const container = await this.container();
    if (!container.running) {
      await this.ensureStarted(this.internetEnabled);
    }

    const startedAt = performance.now();
    const process = await container.exec(command, {
      ...(options.cwd ? { cwd: options.cwd } : {}),
      ...(options.env ? { env: options.env } : {}),
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const timeoutMs = Math.max(
      1_000,
      Math.min(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS),
    );
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      const output = await Promise.race([
        process.output(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            try {
              process.kill(9);
            } finally {
              reject(
                new Error(
                  `Sandbox command exceeded ${timeoutMs} ms timeout.`,
                ),
              );
            }
          }, timeoutMs);
        }),
      ]);

      const stdout = decode(output.stdout);
      const stderr = decode(output.stderr);
      const totalBytes =
        output.stdout.byteLength + output.stderr.byteLength;

      if (totalBytes > MAX_COMMAND_OUTPUT_BYTES) {
        throw new Error(
          'Sandbox command output exceeds the 4 MiB response limit.',
        );
      }

      return {
        exitCode: output.exitCode,
        stdout,
        stderr,
        durationMs: Math.max(0, performance.now() - startedAt),
      };
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }

  private async container(): Promise<LowLevelContainer> {
    const state = this.ctx as unknown as {
      container: LowLevelContainer;
    };
    return state.container;
  }
}

function resolveWorkspacePath(path: string): string {
  if (!path || path.includes('\0')) {
    throw new Error('Sandbox path is invalid.');
  }

  const normalizedInput = path.replaceAll('\\', '/');
  const workspaceRelative =
    normalizedInput === WORKSPACE_ROOT
      ? ''
      : normalizedInput.startsWith(`${WORKSPACE_ROOT}/`)
        ? normalizedInput.slice(WORKSPACE_ROOT.length + 1)
        : normalizedInput.startsWith('/')
          ? normalizedInput.slice(1)
          : normalizedInput;
  const segments = workspaceRelative
    .split('/')
    .filter((segment) => segment && segment !== '.');

  if (segments.some((segment) => segment === '..')) {
    throw new Error('Sandbox paths cannot escape the workspace.');
  }

  const joined = segments.join('/');
  const resolved = `${WORKSPACE_ROOT}/${joined}`.replace(/\/$/, '');

  if (
    resolved !== WORKSPACE_ROOT &&
    !resolved.startsWith(`${WORKSPACE_ROOT}/`)
  ) {
    throw new Error('Sandbox paths cannot escape the workspace.');
  }

  return resolved || WORKSPACE_ROOT;
}

function toWorkspaceRelativePath(path: string): string {
  return path.startsWith(`${WORKSPACE_ROOT}/`)
    ? path.slice(WORKSPACE_ROOT.length + 1)
    : path;
}

function validateRepositoryUrl(value: string): string {
  const url = new URL(value);

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password
  ) {
    throw new Error(
      'Sandbox repository URLs must be credential-free HTTPS URLs.',
    );
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    isPrivateIpLiteral(hostname)
  ) {
    throw new Error('Sandbox repository URL host is not allowed.');
  }

  return url.toString();
}

function isPrivateIpLiteral(hostname: string): boolean {
  if (/^127\./u.test(hostname) || /^10\./u.test(hostname)) return true;
  if (/^192\.168\./u.test(hostname)) return true;

  const match = /^172\.(\d{1,3})\./u.exec(hostname);
  if (match) {
    const second = Number.parseInt(match[1] ?? '', 10);
    if (second >= 16 && second <= 31) return true;
  }

  return (
    hostname === '::1' ||
    hostname.startsWith('fc') ||
    hostname.startsWith('fd') ||
    hostname.startsWith('fe80:')
  );
}

function sanitizeEnvironment(
  env: Readonly<Record<string, string>> | undefined,
): Record<string, string> | undefined {
  if (!env) return undefined;

  const entries = Object.entries(env);
  if (entries.length > 64) {
    throw new Error('Sandbox environment contains too many variables.');
  }

  const sanitized: Record<string, string> = {};

  for (const [name, value] of entries) {
    if (
      !/^[A-Z_][A-Z0-9_]*$/i.test(name) ||
      name.includes('=') ||
      name.includes('\0') ||
      value.includes('\0') ||
      value.length > 8_192
    ) {
      throw new Error('Sandbox environment contains an invalid variable.');
    }

    sanitized[name] = value;
  }

  return sanitized;
}

function decode(value: ArrayBuffer): string {
  return new TextDecoder().decode(value);
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength
    ? value
    : `${value.slice(0, maxLength)}…`;
}
