import { describe, expect, it } from 'vitest'

import {
  allDocsPages,
  buildDocsTree,
  getDocPage,
  getDocsTree,
} from './docs-source'

describe('documentation source', () => {
  it('discovers audience roots and nested documents from MDX files', () => {
    expect(allDocsPages.map((page) => page.url)).toEqual(
      expect.arrayContaining([
        '/documentation/user',
        '/documentation/user/credits/honorable-mentions',
        '/documentation/developer',
        '/documentation/developer/api',
      ]),
    )
  })

  it('keeps audience navigation isolated', () => {
    expect(JSON.stringify(getDocsTree('user'))).not.toContain(
      '/documentation/developer',
    )
    expect(JSON.stringify(getDocsTree('developer'))).not.toContain(
      '/documentation/user',
    )
  })

  it('orders the user guide from onboarding through reference material', () => {
    const tree = getDocsTree('user')

    expect(tree.children.map((node) => node.title)).toEqual([
      'Getting Started',
      'Features',
      'Guides',
      'Integrations',
      'Safety & Privacy',
      'Research & Development',
      'Credits',
    ])

    expect(tree.children[0]?.children.map((node) => node.title)).toEqual([
      'Your First Workflow',
      'Writing Effective Requests',
      'Reviewing Results',
      'Troubleshooting',
    ])
  })

  it('orders developer documentation by implementation lifecycle', () => {
    expect(getDocsTree('developer').children.map((node) => node.title)).toEqual(
      [
        'Getting Started',
        'Architecture',
        'API',
        'Integrations',
        'Security',
        'Testing',
        'Operations',
        'Design',
        'Decisions',
        'Proposals',
        'Research & Development',
        'Releases',
        'Reference',
        'Contributing',
      ],
    )
  })

  it('resolves index and nested slugs', () => {
    expect(getDocPage('user', [])?.title).toBe('User Documentation')
    expect(getDocPage('user', ['credits', 'honorable-mentions'])?.title).toBe(
      'Honorable Mentions',
    )
  })

  it('creates folder nodes for every directory in a newly discovered path', () => {
    const sourcePage = allDocsPages.find(
      (page) => page.url === '/documentation/user/credits/honorable-mentions',
    )

    expect(sourcePage).toBeDefined()
    if (!sourcePage) throw new Error('Expected documentation fixture')

    const page = {
      ...sourcePage,
      slug: ['guides', 'workspace', 'installation'],
      url: '/documentation/user/guides/workspace/installation',
      filePath: 'user/guides/workspace/installation.mdx',
      title: 'Installation',
    }

    const tree = buildDocsTree('user', [page])
    const guides = tree.children[0]
    const workspace = guides?.children[0]
    const installation = workspace?.children[0]

    expect(guides).toMatchObject({
      segment: 'guides',
      title: 'Guides',
      url: undefined,
    })
    expect(workspace).toMatchObject({
      segment: 'workspace',
      title: 'Workspace',
      url: undefined,
    })
    expect(installation).toMatchObject({
      segment: 'installation',
      title: 'Installation',
      url: '/documentation/user/guides/workspace/installation',
    })
  })
})
