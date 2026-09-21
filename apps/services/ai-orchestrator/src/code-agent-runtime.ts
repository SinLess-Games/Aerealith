import {
  CapabilityRoutingPolicy,
  type ArtifactReference,
  type CodeGenerationInput,
  type CodeGenerationOutput,
  type ModelDescriptor,
  type ModelProvider,
  type OrchestrationOutput,
  type OrchestrationRequest,
  type TextGenerationOutput,
} from '@aerealith-ai/ai-orchestration';
import { z } from 'zod';

import { createArtifactStore } from './artifact-runtime';
import type { AiOrchestratorBindings } from './bindings';
import { CloudflareCodeSandboxProvider } from './cloudflare-code-sandbox';
import { createProviderRegistry } from './provider-runtime';

const MAX_CONTEXT_CHARACTERS = 80_000;
const MAX_PLAN_FILES = 32;
const COMMAND_TIMEOUT_MS = 5 * 60 * 1000;
const ALLOWED_COMMANDS = new Set([
  'node',
  'npm',
  'npx',
  'pnpm',
  'python',
  'python3',
]);

const codePlanSchema = z.object({
  summary: z.string().min(1).max(20_000),
  files: z
    .array(
      z.object({
        path: z.string().min(1).max(4_096),
        content: z.string().max(2 * 1024 * 1024),
      }),
    )
    .max(MAX_PLAN_FILES)
    .default([]),
  commands: z
    .array(
      z.object({
        command: z.string().min(1).max(128),
        args: z.array(z.string().max(4_096)).max(64).default([]),
      }),
    )
    .max(8)
    .default([]),
});

export class CodeSandboxUnavailableError extends Error {
  constructor() {
    super('The Cloudflare code sandbox is not configured.');
    this.name = 'CodeSandboxUnavailableError';
  }
}

export async function executeCodeAgent(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
  runId: string,
): Promise<OrchestrationOutput> {
  if (!bindings.AI_CODE_SANDBOX) {
    throw new CodeSandboxUnavailableError();
  }

  const input = request.input as CodeGenerationInput;
  const tenantId = requireTenantId(request);
  const sandboxProvider = new CloudflareCodeSandboxProvider(
    bindings.AI_CODE_SANDBOX,
  );
  const workspaceId = input.repository?.workspaceId
    ? `user:${tenantId}:workspace:${input.repository.workspaceId}`
    : `user:${tenantId}:run:${runId}`;
  const session = await sandboxProvider.create({
    ...(input.repository?.url
      ? { repositoryUrl: input.repository.url }
      : {}),
    ...(input.repository?.ref
      ? { ref: input.repository.ref }
      : {}),
    workspaceId,
    networkAccess: Boolean(input.repository?.url),
  });

  try {
    const context = await collectRepositoryContext(session, input);
    const { provider, model } = await selectCodeTarget(bindings, request);
    const planResult = await provider.execute(
      {
        ...request,
        capability: 'code',
        input: {
          mode: 'generate',
          instruction: buildAgentPrompt(input, context),
        } satisfies CodeGenerationInput,
      },
      model,
    );
    const planText = (planResult.content as CodeGenerationOutput).summary;
    const plan = parseCodePlan(planText);

    if (input.mode === 'review' || input.mode === 'test') {
      if (plan.files.length > 0) {
        throw new Error(
          `Coding mode "${input.mode}" is read-only and cannot modify files.`,
        );
      }
    }

    for (const file of plan.files) {
      await session.writeFile(file.path, file.content);
    }

    let lastCommand:
      | {
          command: string;
          exitCode: number;
          stdout: string;
          stderr: string;
        }
      | undefined;

    for (const command of plan.commands) {
      assertAllowedCommand(command.command);

      const result = await session.execute({
        command: command.command,
        args: command.args,
        limits: {
          timeoutMs: COMMAND_TIMEOUT_MS,
          networkAccess: Boolean(input.repository?.url),
        },
      });

      lastCommand = {
        command: [command.command, ...command.args].join(' '),
        exitCode: result.exitCode,
        stdout: truncate(result.stdout, 100_000),
        stderr: truncate(result.stderr, 100_000),
      };

      if (result.exitCode !== 0) break;
    }

    const changedFiles = await gitChangedFiles(session);
    const patch = await gitPatch(session);
    const patchArtifact = patch
      ? await persistPatch(bindings, tenantId, runId, patch)
      : undefined;

    const content: CodeGenerationOutput = {
      summary: plan.summary,
      ...(changedFiles.length > 0 ? { changedFiles } : {}),
      ...(patchArtifact ? { patchArtifact } : {}),
      ...(lastCommand
        ? {
            testResults: {
              passed: lastCommand.exitCode === 0,
              command: lastCommand.command,
              stdout: lastCommand.stdout,
              stderr: lastCommand.stderr,
            },
          }
        : {}),
    };

    return {
      content,
      providerId: planResult.providerId,
      modelId: planResult.modelId,
      ...(planResult.usage ? { usage: planResult.usage } : {}),
      ...(patchArtifact ? { artifacts: [patchArtifact.id] } : {}),
    };
  } finally {
    if (!input.repository?.workspaceId) {
      await session.close().catch(() => undefined);
    }
  }
}

export function codeRequestNeedsSandbox(
  input: CodeGenerationInput,
): boolean {
  return (
    input.mode !== 'generate' ||
    Boolean(input.repository?.url) ||
    Boolean(input.repository?.workspaceId)
  );
}

async function collectRepositoryContext(
  session: Awaited<
    ReturnType<CloudflareCodeSandboxProvider['create']>
  >,
  input: CodeGenerationInput,
): Promise<string> {
  const listed = await session.listFiles('.');
  const requested = input.paths?.length
    ? input.paths
    : listed.filter(isUsefulSourceFile).slice(0, 24);
  const unique = [...new Set(requested)].slice(0, 32);
  const sections: string[] = [];
  let used = 0;

  for (const path of unique) {
    if (used >= MAX_CONTEXT_CHARACTERS) break;

    try {
      const content = await session.readFile(path);
      const remaining = MAX_CONTEXT_CHARACTERS - used;
      const clipped = content.slice(0, remaining);
      sections.push(
        `--- FILE: ${path} ---\n${clipped}\n--- END FILE ---`,
      );
      used += clipped.length;
    } catch {
      // A requested path may be binary or absent. The model still receives
      // the repository file listing below.
    }
  }

  return [
    'Repository files:',
    listed.slice(0, 500).join('\n'),
    '',
    ...sections,
  ].join('\n');
}

function buildAgentPrompt(
  input: CodeGenerationInput,
  context: string,
): string {
  return [
    'You are planning a coding task that will be executed in an isolated Cloudflare container.',
    'Return ONLY a JSON object matching this exact shape:',
    '{"summary":"what you changed","files":[{"path":"relative/path","content":"complete replacement file content"}],"commands":[{"command":"pnpm","args":["test"]}]}',
    '',
    'Rules:',
    '- File paths must be relative to the repository root.',
    '- files must contain complete replacement contents, not diffs.',
    '- Never use shell wrappers such as sh or bash.',
    '- Allowed commands are node, npm, npx, pnpm, python, and python3.',
    '- Keep commands minimal and deterministic.',
    '- For review or test mode, files MUST be an empty array.',
    '- Do not include markdown fences or prose outside the JSON object.',
    '',
    `Mode: ${input.mode}`,
    `Task: ${input.instruction}`,
    ...(input.constraints?.length
      ? [
          'Constraints:',
          ...input.constraints.map((constraint) => `- ${constraint}`),
        ]
      : []),
    '',
    context,
  ].join('\n');
}

function parseCodePlan(value: string) {
  const trimmed = value.trim();
  const withoutFence = trimmed
    .replace(/^\`\`\`(?:json)?\s*/i, '')
    .replace(/\s*\`\`\`$/i, '');
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');

  if (start < 0 || end < start) {
    throw new Error('The coding model did not return a JSON execution plan.');
  }

  const parsed = JSON.parse(withoutFence.slice(start, end + 1));
  return codePlanSchema.parse(parsed);
}

async function selectCodeTarget(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
): Promise<{
  provider: ModelProvider;
  model: ModelDescriptor;
}> {
  const providers = createProviderRegistry(bindings);
  const routing = new CapabilityRoutingPolicy();
  const models = await providers.modelsFor('code');
  const route = routing.select(request, models);
  const provider = providers.get(route.providerId);

  if (!provider) {
    throw new Error(
      `Code provider "${route.providerId}" is not registered.`,
    );
  }

  const available = await provider.listModels();
  const model = available.find(
    (candidate) => candidate.id === route.modelId,
  );

  if (!model) {
    throw new Error(
      `Code model "${route.modelId}" is not available.`,
    );
  }

  return { provider, model };
}

async function gitChangedFiles(
  session: Awaited<
    ReturnType<CloudflareCodeSandboxProvider['create']>
  >,
): Promise<readonly string[]> {
  const result = await session.execute({
    command: 'git',
    args: ['diff', '--name-only'],
    limits: {
      timeoutMs: 30_000,
    },
  }).catch(() => undefined);

  if (!result || result.exitCode !== 0) return [];

  return result.stdout
    .split('\n')
    .map((path) => path.trim())
    .filter(Boolean)
    .slice(0, 256);
}

async function gitPatch(
  session: Awaited<
    ReturnType<CloudflareCodeSandboxProvider['create']>
  >,
): Promise<string | undefined> {
  const result = await session.execute({
    command: 'git',
    args: ['diff', '--no-color', '--binary'],
    limits: {
      timeoutMs: 30_000,
    },
  }).catch(() => undefined);

  if (!result || result.exitCode !== 0 || !result.stdout.trim()) {
    return undefined;
  }

  return result.stdout;
}

async function persistPatch(
  bindings: AiOrchestratorBindings,
  tenantId: string,
  runId: string,
  patch: string,
): Promise<ArtifactReference | undefined> {
  const artifacts = createArtifactStore(bindings);
  if (!artifacts) return undefined;

  return artifacts.put(`user:${tenantId}`, {
    kind: 'code',
    contentType: 'text/x-diff; charset=utf-8',
    body: new TextEncoder().encode(patch).buffer,
    metadata: {
      purpose: 'code-patch',
      runId,
    },
  });
}

function assertAllowedCommand(command: string): void {
  if (!ALLOWED_COMMANDS.has(command)) {
    throw new Error(
      `Coding plan requested disallowed command "${command}".`,
    );
  }
}

function isUsefulSourceFile(path: string): boolean {
  return /(?:^|\/)(?:package\.json|pnpm-workspace\.yaml|nx\.json|tsconfig[^/]*\.json|README\.md)$|\.(?:ts|tsx|js|jsx|mjs|cjs|json|yaml|yml|md|py|go|rs|java|kt|css|scss|html)$/i.test(
    path,
  );
}

function requireTenantId(request: OrchestrationRequest): string {
  if (!request.tenantId) {
    throw new Error(
      'Trusted tenant context is required for sandboxed coding tasks.',
    );
  }

  return request.tenantId;
}

function truncate(value: string, limit: number): string {
  return value.length <= limit ? value : `${value.slice(0, limit)}…`;
}
