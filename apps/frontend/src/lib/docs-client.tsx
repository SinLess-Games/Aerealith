import type { MDXComponents } from 'mdx/types'
import type { ComponentType, ReactNode } from 'react'

import browserCollections from '../../.source/browser'
import { docsManifestEntries } from './docs-manifest'

/**
 * Properties supplied to compiled MDX documentation pages.
 *
 * The component map is owned by the frontend, allowing MDX documents in
 * `libs/content` to use Aerealith documentation components without importing
 * frontend or UI implementation files directly.
 */
export interface DocsContentProps {
  components?: MDXComponents
}

/**
 * Minimum shape required from a compiled MDX module.
 *
 * Generated Fumadocs modules also contain frontmatter, table-of-contents data,
 * structured search data, and extracted references. This adapter only needs
 * the default MDX component.
 */
interface CompiledMdxModule {
  default: ComponentType<{
    components?: MDXComponents
  }>
}

/**
 * Raw browser-safe documentation collection entries.
 *
 * These entries expose document metadata and generated paths without eagerly
 * loading every compiled MDX page into the application's initial bundle.
 */
export const docsEntries = docsManifestEntries

/**
 * Browser-side Fumadocs content loader.
 *
 * Each MDX document is loaded asynchronously when its route is visited. Never
 * replace the browser collection import with `collections/server` in the Vite
 * SPA.
 */
export const docsClient = browserCollections.docs.createClientLoader({
  component(
    compiledModule: CompiledMdxModule,
    props: DocsContentProps,
  ): ReactNode {
    const MdxContent = compiledModule.default

    return <MdxContent components={props.components} />
  },
})

/**
 * Preload a compiled MDX page before rendering it.
 *
 * The path must be the generated Fumadocs document path, not the public URL.
 */
export async function preloadDoc(path: string): Promise<void> {
  await docsClient.preload(path)
}

/**
 * Render a documentation page that has already been resolved and preloaded.
 *
 * This wraps a React hook and must therefore be called unconditionally from a
 * React component or another custom hook.
 */
export function useDocContent(
  path: string,
  props: DocsContentProps = {},
): ReactNode {
  return docsClient.useContent(path, props)
}
