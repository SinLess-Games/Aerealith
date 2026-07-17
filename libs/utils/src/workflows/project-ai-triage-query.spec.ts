// libs/utils/src/workflows/project-ai-triage-query.spec.ts

import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

function extractItemQueryFromWorkflow(workflowContent: string): string {
  const match = workflowContent.match(
    /item_query = <<~GRAPHQL\n([\s\S]*?)\n\s*GRAPHQL/,
  )

  if (!match) {
    throw new Error(
      'Could not find item_query GraphQL block in 103-project-ai-triage workflow.',
    )
  }

  return match[1]
}

function getTopLevelIssueOrPullRequestSelections(query: string): string[] {
  const lines = query.split('\n')
  const startLineIndex = lines.findIndex((line) =>
    line.includes('issueOrPullRequest(number: $itemNumber) {'),
  )

  if (startLineIndex < 0) {
    throw new Error(
      'Could not find issueOrPullRequest selection block in item_query.',
    )
  }

  const selections: string[] = []
  let depth = 1

  for (const line of lines.slice(startLineIndex + 1)) {
    const trimmed = line.trim()

    if (depth === 1 && trimmed.length > 0 && trimmed !== '}') {
      selections.push(trimmed)
    }

    const openingBraces = (line.match(/{/g) ?? []).length
    const closingBraces = (line.match(/}/g) ?? []).length
    depth += openingBraces - closingBraces

    if (depth === 0) {
      break
    }
  }

  return selections
}

describe('project AI triage workflow item query', () => {
  const workflowContent = readFileSync(
    new URL(
      '../../../../.github/workflows/103-project-ai-triage.yaml',
      import.meta.url,
    ),
    'utf8',
  )
  const itemQuery = extractItemQueryFromWorkflow(workflowContent)

  it('uses union-safe top-level selections for issueOrPullRequest', () => {
    expect(getTopLevelIssueOrPullRequestSelections(itemQuery)).toEqual([
      '__typename',
      '... on Issue {',
      '... on PullRequest {',
    ])
  })

  it('binds aiTriageFieldName within both Issue and PullRequest fragments', () => {
    const matches =
      itemQuery.match(
        /aiTriageValue: fieldValueByName\(name: \$aiTriageFieldName\)/g,
      ) ?? []

    expect(matches).toHaveLength(2)
  })
})
