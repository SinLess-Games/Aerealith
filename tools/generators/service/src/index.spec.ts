import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { describe, expect, it } from 'vitest';

import serviceGenerator from './index';

function readRequired(
  tree: ReturnType<typeof createTreeWithEmptyWorkspace>,
  path: string,
) {
  const value = tree.read(path, 'utf-8');

  if (value === null) {
    throw new Error(`Expected generated file: ${path}`);
  }

  return value;
}

describe('serviceGenerator', () => {
  it('creates a normalized, runnable Hono service', async () => {
    const tree = createTreeWithEmptyWorkspace();

    const installTask = await serviceGenerator(tree, {
      name: 'Billing API',
    });

    expect(installTask).toBeTypeOf('function');

    expect(tree.exists('apps/services/billing-api/project.json')).toBe(true);
    expect(tree.exists('apps/services/billing-api/vitest.config.mts')).toBe(
      true,
    );
    expect(tree.exists('apps/services/billing-api/Dockerfile')).toBe(true);
    expect(tree.exists('apps/services/billing-api/wrangler.toml')).toBe(true);

    const project = JSON.parse(
      readRequired(tree, 'apps/services/billing-api/project.json'),
    );

    expect(project).toMatchObject({
      name: 'service-billing-api',
      targets: {
        test: {
          executor: '@nx/vitest:test',
        },
        'worker-serve': {
          continuous: true,
          options: {
            cwd: 'apps/services/billing-api',
            command: 'wrangler dev',
          },
        },
        typegen: {
          options: {
            cwd: 'apps/services/billing-api',
            command: 'wrangler types',
          },
        },
        'worker-dry-run': {
          options: {
            command: 'wrangler deploy --dry-run',
          },
        },
        deploy: {
          options: {
            command: 'wrangler deploy',
          },
        },
      },
    });

    const wranglerConfig = readRequired(
      tree,
      'apps/services/billing-api/wrangler.toml',
    );

    expect(wranglerConfig).toContain('name = "aerealith-billing-api"');
    expect(wranglerConfig).toContain('main = "src/worker.ts"');
    expect(wranglerConfig).toContain('# [[secrets_store_secrets]]');
    expect(wranglerConfig).toContain('# store_id = "<STORE_ID>"');

    const mainSource = readRequired(
      tree,
      'apps/services/billing-api/src/main.ts',
    );

    expect(mainSource).toContain(
      "const SERVICE_ROUTE = '/api/V1/services/billing-api' as const;",
    );
    expect(mainSource).toContain('app.get(SERVICE_ROUTE');
  });

  it('preserves an existing generator script without requiring frontend routes', async () => {
    const tree = createTreeWithEmptyWorkspace();

    const packageJson = JSON.parse(readRequired(tree, 'package.json'));

    packageJson.scripts = {
      ...packageJson.scripts,
      'services:new': 'custom-generator-command',
    };

    tree.write('package.json', JSON.stringify(packageJson));

    await serviceGenerator(tree, {
      name: 'audit_log',
    });

    expect(tree.exists('apps/services/audit-log/src/worker.ts')).toBe(true);

    expect(
      tree.read('apps/services/audit-log/wrangler.toml', 'utf-8'),
    ).toContain('name = "aerealith-audit-log"');

    expect(
      JSON.parse(readRequired(tree, 'package.json')).scripts['services:new'],
    ).toBe('custom-generator-command');
  });

  it('does not require the workspace package manifest to generate a service', async () => {
    const tree = createTreeWithEmptyWorkspace();

    tree.delete('package.json');

    const installTask = await serviceGenerator(tree, {
      name: 'standalone',
    });

    expect(installTask).toBeTypeOf('function');
    expect(tree.exists('apps/services/standalone/project.json')).toBe(true);
    expect(tree.exists('apps/services/standalone/package.json')).toBe(true);
  });

  it('refuses to overwrite an existing service', async () => {
    const tree = createTreeWithEmptyWorkspace();

    await serviceGenerator(tree, {
      name: 'Billing API',
    });

    await expect(
      serviceGenerator(tree, {
        name: 'Billing API',
      }),
    ).rejects.toThrow(
      'Service "billing-api" already exists at apps/services/billing-api.',
    );
  });
});
