import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { describe, expect, it } from 'vitest'

import serviceGenerator from './index'

function readRequired(
  tree: ReturnType<typeof createTreeWithEmptyWorkspace>,
  path: string,
) {
  const value = tree.read(path, 'utf-8')

  if (value === null) {
    throw new Error(`Expected generated file: ${path}`)
  }

  return value
}

function countOccurrences(value: string, search: string): number {
  return value.split(search).length - 1
}

describe('serviceGenerator', () => {
  it('creates a normalized, runnable Hono service', async () => {
    const tree = createTreeWithEmptyWorkspace()

    tree.write(
      'apps/frontend/src/app/app.tsx',
      [
        "import { Routes, Route } from 'react-router-dom';",
        '',
        'export default function App() {',
        '  return (',
        '    <Routes>',
        '      <Route path="/" element={<div />} />',
        '    </Routes>',
        '  )',
        '}',
      ].join('\n'),
    )

    const installTask = await serviceGenerator(tree, {
      name: 'Billing API',
    })

    expect(installTask).toBeTypeOf('function')
    expect(tree.exists('apps/services/billing-api/project.json')).toBe(true)
    expect(tree.exists('apps/services/billing-api/vitest.config.mts')).toBe(
      true,
    )
    expect(tree.exists('apps/services/billing-api/Dockerfile')).toBe(true)

    expect(
      JSON.parse(readRequired(tree, 'apps/services/billing-api/project.json')),
    ).toMatchObject({
      name: 'service-billing-api',
      targets: {
        test: {
          executor: '@nx/vitest:test',
        },
      },
    })

    expect(
      tree.read('apps/services/billing-api/src/main.ts', 'utf-8'),
    ).toContain("app.get('/api/v1/services/billing-api'")
    expect(tree.read('apps/frontend/src/app/app.tsx', 'utf-8')).toContain(
      '<BillingApiPage />',
    )

    const packageJson = JSON.parse(readRequired(tree, 'package.json'))
    expect(packageJson.scripts['services:new']).toBe(
      'nx g @aerealith-ai/service-generator:service --name',
    )
  })

  it('preserves an existing generator script without requiring frontend routes', async () => {
    const tree = createTreeWithEmptyWorkspace()
    const packageJson = JSON.parse(readRequired(tree, 'package.json'))

    packageJson.scripts = {
      ...packageJson.scripts,
      'services:new': 'custom-generator-command',
    }
    tree.write('package.json', JSON.stringify(packageJson))

    await serviceGenerator(tree, { name: 'audit_log' })

    expect(tree.exists('apps/services/audit-log/src/worker.ts')).toBe(true)
    expect(
      JSON.parse(readRequired(tree, 'package.json')).scripts['services:new'],
    ).toBe('custom-generator-command')
  })

  it('reports a missing workspace package manifest clearly', async () => {
    const tree = createTreeWithEmptyWorkspace()
    tree.delete('package.json')

    await expect(serviceGenerator(tree, { name: 'broken' })).rejects.toThrow(
      'Unable to read package.json',
    )
  })

  it('does not duplicate frontend route wiring when rerun for the same service', async () => {
    const tree = createTreeWithEmptyWorkspace()

    tree.write(
      'apps/frontend/src/app/app.tsx',
      [
        "import { Routes, Route } from 'react-router-dom';",
        '',
        'export default function App() {',
        '  return (',
        '    <Routes>',
        '      <Route path="/" element={<div />} />',
        '    </Routes>',
        '  )',
        '}',
      ].join('\n'),
    )

    await serviceGenerator(tree, { name: 'Billing API' })
    await serviceGenerator(tree, { name: 'Billing API' })

    const appRoutes = readRequired(tree, 'apps/frontend/src/app/app.tsx')

    expect(
      countOccurrences(
        appRoutes,
        "import { BillingApiPage } from '../services/billing-api/routes';",
      ),
    ).toBe(1)
    expect(
      countOccurrences(
        appRoutes,
        '      <Route path="/api/v1/services/billing-api" element={<BillingApiPage />} />',
      ),
    ).toBe(1)
  })
})
