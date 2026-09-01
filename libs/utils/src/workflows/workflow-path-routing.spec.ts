import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const workspaceRoot = resolve(import.meta.dirname, '../../../..');

function readWorkflow(name: string): string {
  return readFileSync(
    resolve(workspaceRoot, '.github/workflows', name),
    'utf8',
  );
}

describe('pull request workflow path routing', () => {
  it('skips code-only workflows for infra-only pull requests', () => {
    const codeOnlyWorkflows = [
      '00-ci.yaml',
      '02-vitest.yaml',
      '03-coverage.yaml',
      '04-graphql-schema.yaml',
      '08-codeql.yaml',
      '10-snyk.yaml',
      '11-sonar.yaml',
      '16-meticulous.yaml',
      '17-code-coverage.yaml',
    ] as const;

    for (const workflow of codeOnlyWorkflows) {
      const pullRequestTrigger = readWorkflow(workflow).match(
        /^ {2}pull_request:[\s\S]*?(?=^ {2}[a-z_]+:|^permissions:|^concurrency:|^jobs:)/m,
      )?.[0];

      expect(pullRequestTrigger, `${workflow} pull_request trigger`).toContain(
        'paths-ignore:',
      );
      expect(pullRequestTrigger, `${workflow} infra exclusion`).toContain(
        '- "infra/**"',
      );
    }
  });

  it('keeps infrastructure-relevant validation enabled for infra changes', () => {
    const infrastructureWorkflows = [
      '01-commitlint.yaml',
      '05-repository-quality.yaml',
      '06-dependency-review.yaml',
      '07-gitleaks.yaml',
      '09-container-security.yaml',
    ] as const;

    for (const workflow of infrastructureWorkflows) {
      expect(readWorkflow(workflow), workflow).not.toContain('- "infra/**"');
    }
  });
});
