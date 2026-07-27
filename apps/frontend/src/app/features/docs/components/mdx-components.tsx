import { createContext, useContext, type ComponentPropsWithoutRef } from 'react'

import {
  DocsApiEndpoint,
  DocsBadge,
  DocsCallout,
  DocsCard,
  DocsCardGrid,
  DocsCodeBlock,
  DocsDetails,
  DocsFigure,
  DocsInlineCode,
  DocsKeyboardKey,
  DocsLinkCard,
  DocsProse,
  DocsSteps,
  DocsTable,
  DocsTabs,
} from '@aerealith-ai/ui'
import type { MDXComponents } from 'mdx/types'

import { Mermaid } from './mermaid'

/**
 * Tracks whether a rendered `code` element is inside a fenced code block.
 *
 * MDX maps both inline code and fenced code to the `code` element. The context
 * lets Aerealith render inline code with `DocsInlineCode` while preserving the
 * syntax-highlighted markup generated inside `pre` blocks.
 */
const CodeBlockContext = createContext(false)

/**
 * Renders external links safely while preserving internal and anchor
 * navigation.
 */
function MdxAnchor({
  children,
  href,
  rel,
  target,
  ...props
}: Readonly<ComponentPropsWithoutRef<'a'>>) {
  const isExternal =
    typeof href === 'string' &&
    (href.startsWith('https://') || href.startsWith('http://'))

  const resolvedTarget = isExternal ? (target ?? '_blank') : target
  const resolvedRel = resolvedTarget === '_blank' ? createSecureRel(rel) : rel

  return (
    <a
      {...props}
      data-external={isExternal || undefined}
      href={href}
      rel={resolvedRel}
      target={resolvedTarget}
    >
      {children}
    </a>
  )
}

/**
 * Wraps fenced code blocks with the shared Aerealith documentation shell.
 *
 * Shiki-generated `code` markup remains intact inside the component.
 */
function MdxPre({
  children,
  ...props
}: Readonly<ComponentPropsWithoutRef<'pre'>>) {
  return (
    <CodeBlockContext.Provider value>
      <DocsCodeBlock {...props}>{children}</DocsCodeBlock>
    </CodeBlockContext.Provider>
  )
}

/**
 * Distinguishes inline code from syntax-highlighted code inside a `pre`.
 */
function MdxCode(props: Readonly<ComponentPropsWithoutRef<'code'>>) {
  const isCodeBlock = useContext(CodeBlockContext)

  if (isCodeBlock) {
    return <code {...props} />
  }

  return <DocsInlineCode {...props} />
}

/**
 * Adds horizontal overflow handling around generated Markdown tables.
 */
function MdxTable(props: Readonly<ComponentPropsWithoutRef<'table'>>) {
  return (
    <DocsTable>
      <table {...props} />
    </DocsTable>
  )
}

/**
 * Applies safe browser-loading defaults to documentation images.
 */
function MdxImage({
  alt,
  decoding,
  loading,
  ...props
}: Readonly<ComponentPropsWithoutRef<'img'>>) {
  return (
    <img
      {...props}
      alt={alt ?? ''}
      decoding={decoding ?? 'async'}
      loading={loading ?? 'lazy'}
    />
  )
}

/**
 * Native Markdown elements and Aerealith-specific MDX components.
 *
 * Custom components remain explicitly prefixed with `Docs` so their behavior
 * is clear inside MDX files and they do not collide with native HTML elements.
 */
export const aerealithMdxComponents = {
  a: MdxAnchor,
  code: MdxCode,
  img: MdxImage,
  pre: MdxPre,
  table: MdxTable,

  Mermaid,

  Requirement: (props: ComponentPropsWithoutRef<typeof DocsCallout>) => (
    <DocsCallout
      {...props}
      variant='info'
      title={props.title ?? 'Requirement'}
    />
  ),
  Warning: (props: ComponentPropsWithoutRef<typeof DocsCallout>) => (
    <DocsCallout {...props} variant='warning' />
  ),
  SecurityNote: (props: ComponentPropsWithoutRef<typeof DocsCallout>) => (
    <DocsCallout
      {...props}
      variant='security'
      title={props.title ?? 'Security note'}
    />
  ),
  ArchitectureDecision: (
    props: ComponentPropsWithoutRef<typeof DocsCallout>,
  ) => (
    <DocsCallout
      {...props}
      variant='note'
      title={props.title ?? 'Architecture decision'}
    />
  ),
  ApiEndpoint: ({
    children,
    ...props
  }: ComponentPropsWithoutRef<typeof DocsApiEndpoint>) => (
    <div>
      <DocsApiEndpoint {...props} />
      {children}
    </div>
  ),

  DocsApiEndpoint,
  DocsBadge,
  DocsCallout,
  DocsCard,
  DocsCardGrid,
  DocsCodeBlock,
  DocsDetails,
  DocsFigure,
  DocsInlineCode,
  DocsKeyboardKey,
  DocsLinkCard,
  DocsProse,
  DocsSteps,
  DocsTable,
  DocsTabs,
} satisfies MDXComponents

/**
 * Returns the complete MDX component map.
 *
 * Page-level components are spread last so an individual documentation page
 * or route can override any default component when necessary.
 */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...aerealithMdxComponents,
    ...components,
  }
}

/**
 * Conventional MDX hook export.
 *
 * Some MDX integrations look for this exact export name.
 */
export const useMDXComponents = getMDXComponents

function createSecureRel(rel: string | undefined): string {
  const tokens = new Set(
    (rel ?? '')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean),
  )

  tokens.add('noopener')
  tokens.add('noreferrer')

  return [...tokens].join(' ')
}

export default getMDXComponents
