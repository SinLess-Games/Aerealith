import type {
  OrchestrationOutput,
  OrchestrationRequest,
  ToolDefinition,
  ToolInvocationInput,
  ToolInvocationOutput,
} from '@aerealith-ai/ai-orchestration';
import { z } from 'zod';

import type { AiOrchestratorBindings } from './bindings';
import { CloudflareCodeSandboxProvider } from './cloudflare-code-sandbox';

const commonWorkspaceSchema = z.object({
  workspaceId: z.string().min(1).max(256),
  repository: z
    .object({
      url: z.url().optional(),
      ref: z.string().min(1).max(512).optional(),
    })
    .optional(),
});

const listFilesSchema = commonWorkspaceSchema.extend({
  path: z.string().min(1).max(4096).optional(),
});

const readFileSchema = commonWorkspaceSchema.extend({
  path: z.string().min(1).max(4096),
});

const searchSchema = commonWorkspaceSchema.extend({
  pattern: z.string().min(1).max(1024),
  path: z.string().min(1).max(4096).optional(),
});

const writeFileSchema = commonWorkspaceSchema.extend({
  path: z.string().min(1).max(4096),
  content: z.string().max(2 * 1024 * 1024),
});

const execSchema = commonWorkspaceSchema.extend({
  command: z.enum([
    'node',
    'npm',
    'npx',
    'pnpm',
    'python',
    'python3',
  ]),
  args: z.array(z.string().max(4096)).max(64).default([]),
  cwd: z.string().min(1).max(4096).optional(),
  timeoutMs: z.number().int().min(1000).max(15 * 60 * 1000).optional(),
});

export const sandboxToolDefinitions: readonly ToolDefinition[] = [
  {
    name: 'sandbox.list_files',
    description:
      'List files in a tenant-scoped Cloudflare code sandbox workspace.',
    inputSchema: {
      type: 'object',
      required: ['workspaceId'],
      properties: {
        workspaceId: { type: 'string' },
        repository: { type: 'object' },
        path: { type: 'string' },
      },
    },
  },
  {
    name: 'sandbox.read_file',
    description:
      'Read a UTF-8 text file from a tenant-scoped Cloudflare code sandbox workspace.',
    inputSchema: {
      type: 'object',
      required: ['workspaceId', 'path'],
      properties: {
        workspaceId: { type: 'string' },
        repository: { type: 'object' },
        path: { type: 'string' },
      },
    },
  },
  {
    name: 'sandbox.search',
    description:
      'Search file contents with ripgrep inside a tenant-scoped Cloudflare code sandbox workspace.',
    inputSchema: {
      type: 'object',
      required: ['workspaceId', 'pattern'],
      properties: {
        workspaceId: { type: 'string' },
        repository: { type: 'object' },
        pattern: { type: 'string' },
        path: { type: 'string' },
      },
    },
  },
  {
    name: 'sandbox.write_file',
    description:
      'Write a complete UTF-8 text file in a tenant-scoped Cloudflare code sandbox workspace.',
    inputSchema: {
      type: 'object',
      required: ['workspaceId', 'path', 'content'],
      properties: {
        workspaceId: { type: 'string' },
        repository: { type: 'object' },
        path: { type: 'string' },
        content: { type: 'string' },
      },
    },
    requiresApproval: true,
  },
  {
    name: 'sandbox.exec',
    description:
      'Execute an allowlisted command in a tenant-scoped Cloudflare code sandbox workspace.',
    inputSchema: {
      type: 'object',
      required: ['workspaceId', 'command'],
      properties: {
        workspaceId: { type: 'string' },
        repository: { type: 'object' },
        command: {
          enum: ['node', 'npm', 'npx', 'pnpm', 'python', 'python3'],
        },
        args: { type: 'array', items: { type: 'string' } },
        cwd: { type: 'string' },
        timeoutMs: { type: 'integer' },
      },
    },
    requiresApproval: true,
  },
];

export class ToolRuntimeUnavailableError extends Error {
  constructor() {
    super('The sandbox tool runtime is not configured.');
    this.name = 'ToolRuntimeUnavailableError';
  }
}

export class ToolApprovalRequiredError extends Error {
  constructor(name: string) {
    super(`Tool "${name}" requires explicit approval.`);
    this.name = 'ToolApprovalRequiredError';
  }
}

export async function executeToolRequest(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
): Promise<OrchestrationOutput> {
  if (!bindings.AI_CODE_SANDBOX) {
    throw new ToolRuntimeUnavailableError();
  }

  const tenantId = requireTenantId(request);
  const input = request.input as ToolInvocationInput;
  const approved = request.metadata?.['approved'] === 'true';
  const definition = sandboxToolDefinitions.find(
    (candidate) => candidate.name === input.name,
  );

  if (!definition) {
    throw new Error(`Tool "${input.name}" is not registered.`);
  }

  if (definition.requiresApproval && !approved) {
    throw new ToolApprovalRequiredError(input.name);
  }

  const sandboxProvider = new CloudflareCodeSandboxProvider(
    bindings.AI_CODE_SANDBOX,
  );

  const parsed = parseArguments(input.name, input.arguments);
  const repository = parsed.repository;
  const session = await sandboxProvider.create({
    workspaceId: `user:${tenantId}:tool:${parsed.workspaceId}`,
    ...(repository?.url ? { repositoryUrl: repository.url } : {}),
    ...(repository?.ref ? { ref: repository.ref } : {}),
    networkAccess: Boolean(repository?.url),
  });

  let output: unknown;

  switch (input.name) {
    case 'sandbox.list_files':
      output = await session.listFiles(parsed.path ?? '.');
      break;
    case 'sandbox.read_file':
      output = await session.readFile(parsed.path);
      break;
    case 'sandbox.search':
      output = await session.search(
        parsed.pattern,
        parsed.path ?? '.',
      );
      break;
    case 'sandbox.write_file':
      await session.writeFile(parsed.path, parsed.content);
      output = { written: true, path: parsed.path };
      break;
    case 'sandbox.exec':
      output = await session.execute({
        command: parsed.command,
        args: parsed.args,
        ...(parsed.cwd ? { cwd: parsed.cwd } : {}),
        limits: {
          timeoutMs: parsed.timeoutMs ?? 120_000,
          networkAccess: Boolean(repository?.url),
        },
      });
      break;
    default:
      throw new Error(`Tool "${input.name}" is not implemented.`);
  }

  const content: ToolInvocationOutput = { output };

  return {
    content,
    providerId: 'cloudflare-code-sandbox',
    modelId: 'sandbox-tools-v1',
  };
}

function parseArguments(
  name: string,
  value: unknown,
): any {
  switch (name) {
    case 'sandbox.list_files':
      return listFilesSchema.parse(value);
    case 'sandbox.read_file':
      return readFileSchema.parse(value);
    case 'sandbox.search':
      return searchSchema.parse(value);
    case 'sandbox.write_file':
      return writeFileSchema.parse(value);
    case 'sandbox.exec':
      return execSchema.parse(value);
    default:
      throw new Error(`Tool "${name}" is not registered.`);
  }
}

function requireTenantId(request: OrchestrationRequest): string {
  if (!request.tenantId) {
    throw new Error(
      'Trusted tenant context is required for tool execution.',
    );
  }

  return request.tenantId;
}
