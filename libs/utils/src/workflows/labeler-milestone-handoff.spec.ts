import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const workspaceRoot = resolve(__dirname, '../../../..')

const readWorkflow = (name: string): string =>
  readFileSync(resolve(workspaceRoot, '.github/workflows', name), 'utf8')

describe('labeler and milestone workflow handoff', () => {
  const labelerWorkflow = readWorkflow('13-labeler.yaml')
  const milestoneWorkflow = readWorkflow('15-assign-milestones.yaml')

  it('makes milestone assignment reusable with an explicit item number', () => {
    expect(milestoneWorkflow).toContain('workflow_call:')
    expect(milestoneWorkflow).toMatch(
      /workflow_call:\s+inputs:\s+number:\s+[\s\S]*?required: true[\s\S]*?type: number/,
    )
  })

  it('runs milestone assignment after pull request labels are applied', () => {
    expect(labelerWorkflow).toMatch(
      /assign-milestone:\s+[\s\S]*?needs: label[\s\S]*?issues: write[\s\S]*?uses: \.\/\.github\/workflows\/15-assign-milestones\.yaml[\s\S]*?number: \$\{\{ github\.event\.pull_request\.number \}\}/,
    )
  })

  it('supports pull requests targeting the development branch', () => {
    expect(milestoneWorkflow).toMatch(
      /pull_request_target:\s+branches:\s+- dev/,
    )
  })
})
