import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

function readWorkflow(name: string): string {
  return readFileSync(
    new URL(`../../../../.github/workflows/${name}`, import.meta.url),
    'utf8',
  )
}

describe('workflow Nx project discovery', () => {
  it('filters template placeholder project names for test-target discovery', () => {
    const workflows = [
      '02-vitest.yaml',
      '03-coverage.yaml',
      '11-sonar.yaml',
      '17-code-coverage.yaml',
    ] as const

    for (const workflow of workflows) {
      const content = readWorkflow(workflow)

      expect(content).toContain('show projects --withTarget=test --json')
      expect(content).toContain('jq -r \'.[] | select(test("<%.*%>") | not)\'')
    }
  })

  it('uses JSON discovery for e2e projects and excludes template placeholders', () => {
    const content = readWorkflow('03-coverage.yaml')

    expect(content).toContain('show projects --withTarget=e2e --json')
    expect(content).toContain(
      '::error::Nx did not return a valid JSON array of e2e projects.',
    )
    expect(content).toContain('jq -r \'.[] | select(test("<%.*%>") | not)\'')
  })
})
