import { useDeferredValue, useMemo } from 'react'

import { searchDocs, type DocsSearchOptions } from '../../../../lib/docs-source'

export function useDocsSearch(
  query: string,
  options: Readonly<DocsSearchOptions> = {},
) {
  const deferredQuery = useDeferredValue(query)

  return useMemo(
    () => searchDocs(deferredQuery, options),
    [deferredQuery, options],
  )
}
