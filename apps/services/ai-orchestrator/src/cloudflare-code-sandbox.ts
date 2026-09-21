import type {
  CodeSandboxProvider,
  CodeSandboxRequest,
  CodeSandboxSession,
  CommandRequest,
  CommandResult,
} from '@aerealith-ai/ai-orchestration';

import type {
  AiCodeSandboxNamespace,
  AiCodeSandboxStub,
} from './bindings';

export class CloudflareCodeSandboxProvider
  implements CodeSandboxProvider
{
  constructor(
    private readonly namespace: AiCodeSandboxNamespace,
  ) {}

  async create(
    request: CodeSandboxRequest,
  ): Promise<CodeSandboxSession> {
    const sessionId = request.workspaceId?.trim() || crypto.randomUUID();
    const stub = this.namespace.getByName(sessionId);
    const initialized = await stub.initialize({
      ...(request.repositoryUrl
        ? { repositoryUrl: request.repositoryUrl }
        : {}),
      ...(request.ref ? { ref: request.ref } : {}),
      ...(request.networkAccess === undefined
        ? {}
        : { networkAccess: request.networkAccess }),
    });

    return new CloudflareCodeSandboxSession(
      sessionId,
      stub,
      initialized.root,
    );
  }
}

class CloudflareCodeSandboxSession implements CodeSandboxSession {
  constructor(
    readonly id: string,
    private readonly stub: AiCodeSandboxStub,
    private readonly root: string,
  ) {}

  readFile(path: string): Promise<string> {
    return this.stub.readFile(this.scoped(path));
  }

  writeFile(path: string, content: string): Promise<void> {
    return this.stub.writeFile(this.scoped(path), content);
  }

  async listFiles(path = '.'): Promise<readonly string[]> {
    const values = await this.stub.listFiles(this.scoped(path));
    return values.map((value) => this.unscoped(value));
  }

  async search(
    pattern: string,
    path = '.',
  ): Promise<readonly string[]> {
    const values = await this.stub.search(
      pattern,
      this.scoped(path),
    );
    return values.map((value) => this.unscoped(value));
  }

  execute(request: CommandRequest): Promise<CommandResult> {
    return this.stub.execute({
      command: request.command,
      ...(request.args ? { args: request.args } : {}),
      cwd: this.scoped(request.cwd ?? '.'),
      ...(request.env ? { env: request.env } : {}),
      timeoutMs: request.limits.timeoutMs,
      ...(request.limits.networkAccess === undefined
        ? {}
        : { networkAccess: request.limits.networkAccess }),
    });
  }

  close(): Promise<void> {
    return this.stub.close();
  }

  private scoped(path: string): string {
    const normalized = path.replaceAll('\\', '/');

    if (
      normalized === this.root ||
      normalized.startsWith(`${this.root}/`)
    ) {
      return normalized;
    }

    if (normalized === '.' || normalized === '') {
      return this.root;
    }

    const relative = normalized.replace(/^\/+/, '');
    return `${this.root}/${relative}`;
  }

  private unscoped(path: string): string {
    const prefix = this.root
      .replace(/^\/workspace\/?/, '')
      .replace(/\/$/, '');

    if (!prefix) return path;

    return path === prefix
      ? '.'
      : path.startsWith(`${prefix}/`)
        ? path.slice(prefix.length + 1)
        : path;
  }
}
