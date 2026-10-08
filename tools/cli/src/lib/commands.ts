import type { Spec } from './define.js';

const nx = (...a: string[]) => ['pnpm', 'nx', ...a];
const pnpm = (...a: string[]) => ['pnpm', ...a];
const drizzle = (cmd: string, args: string[]) => [
  'pnpm',
  'exec',
  'drizzle-kit',
  cmd,
  '--config=libs/db/drizzle.config.ts',
  ...args,
];

export const specs: Spec[] = [
  // Nx tasks
  {
    path: ['dev'],
    description: 'Start the frontend dev server',
    steps: (a) => [nx('run', 'frontend:dev', ...a)],
  },
  {
    path: ['check'],
    description: 'Format check, lint, typecheck and test',
    steps: () => [pnpm('check')],
  },
  {
    path: ['fix'],
    description: 'Format and auto-fix lint issues',
    steps: () => [pnpm('fix')],
  },
  {
    path: ['format'],
    description: 'Format the repository with Prettier',
    steps: () => [pnpm('format')],
  },
  {
    path: ['lint'],
    description: 'Lint code and Markdown',
    steps: () => [pnpm('lint')],
  },
  {
    path: ['typecheck'],
    description: 'Typecheck all projects',
    steps: (a) => [nx('run-many', '-t', 'typecheck', ...a)],
  },
  {
    path: ['test'],
    description: 'Run all tests',
    steps: (a) => [nx('run-many', '-t', 'test', ...a)],
  },
  {
    path: ['e2e'],
    description: 'Run all e2e tests',
    steps: (a) => [nx('run-many', '-t', 'e2e', ...a)],
  },
  ...(['lint', 'typecheck', 'test', 'e2e'] as const).map((t) => ({
    path: ['affected', t],
    description: `Run ${t} on affected projects`,
    steps: (a: string[]) => [nx('affected', '-t', t, ...a)],
  })),

  // Scaffolding
  {
    path: ['new', 'service'],
    description: 'Scaffold a new service: aerealith new service <name>',
    steps: (a) => [
      nx('g', '@aerealith-ai/service-generator:service', '--name', ...a),
    ],
  },

  // Data pipeline
  {
    path: ['data', 'download'],
    description: 'Download raw datasets',
    steps: (a) => [pnpm('exec', 'tsx', 'tools/scripts/download-data.ts', ...a)],
  },
  {
    path: ['data', 'process'],
    description: 'Process raw datasets',
    steps: (a) => [
      pnpm('exec', 'tsx', 'tools/scripts/process-raw-data.ts', ...a),
    ],
  },
  {
    path: ['data', 'pipeline'],
    description: 'Run the full data pipeline',
    steps: (a) => [['bash', 'tools/scripts/pipeline.sh', ...a]],
  },

  // Database
  {
    path: ['db', 'generate'],
    description: 'Generate Drizzle migrations',
    steps: (a) => [drizzle('generate', a)],
  },
  {
    path: ['db', 'migrate'],
    description: 'Apply Drizzle migrations',
    steps: (a) => [drizzle('migrate', a)],
  },
  {
    path: ['db', 'seed'],
    description: 'Seed the database',
    steps: (a) => [nx('run', 'db:seed', ...a)],
  },
  {
    path: ['db', 'studio'],
    description: 'Open Drizzle Studio',
    steps: (a) => [drizzle('studio', a)],
  },

  // Docs and compliance
  {
    path: ['docs', 'headings'],
    description: 'Fix Markdown headings',
    steps: (a) => [['node', 'tools/scripts/fix-markdown-headings.mjs', ...a]],
  },
  {
    path: ['docs', 'lint'],
    description: 'Lint Markdown files',
    steps: () => [pnpm('lint:md')],
  },
  {
    path: ['license', 'check'],
    description: 'Check dependency licenses',
    steps: (a) => [['node', 'tools/scripts/check-licenses.mjs', ...a]],
  },

  // Deploy
  {
    path: ['deploy', 'frontend'],
    description: 'Build and deploy the frontend with Wrangler',
    steps: (a) => [
      nx('build', 'frontend'),
      pnpm(
        'exec',
        'wrangler',
        'deploy',
        '--config',
        'apps/frontend/wrangler.toml',
        ...a,
      ),
    ],
  },
];
