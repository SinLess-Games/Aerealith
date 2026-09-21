export type SandboxLimits = {
  timeoutMs: number;
  memoryMb?: number;
  cpuMs?: number;
  networkAccess?: boolean;
};

export type CommandRequest = {
  command: string;
  args?: readonly string[];
  cwd?: string;
  env?: Readonly<Record<string, string>>;
  limits: SandboxLimits;
};

export type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
};

export interface CodeSandboxSession {
  readonly id: string;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  listFiles(path?: string): Promise<readonly string[]>;
  search(pattern: string, path?: string): Promise<readonly string[]>;
  execute(request: CommandRequest): Promise<CommandResult>;
  close(): Promise<void>;
}

export type CodeSandboxRequest = {
  repositoryUrl?: string;
  ref?: string;
  workspaceId?: string;
  networkAccess?: boolean;
};

export interface CodeSandboxProvider {
  create(request: CodeSandboxRequest): Promise<CodeSandboxSession>;
}
