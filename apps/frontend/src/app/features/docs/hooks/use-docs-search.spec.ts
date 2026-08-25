// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useDocsSearch } from './use-docs-search';

describe('useDocsSearch', () => {
  it('returns audience-filtered documentation results', () => {
    const options = { audience: 'developer' as const, limit: 5 };
    const { result } = renderHook(() => useDocsSearch('API', options));

    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.length).toBeLessThanOrEqual(5);
    expect(
      result.current.every(({ page }) => page.audience === 'developer'),
    ).toBe(true);
  });

  it('returns no results for a blank query', () => {
    const { result } = renderHook(() => useDocsSearch('   '));
    expect(result.current).toEqual([]);
  });
});
