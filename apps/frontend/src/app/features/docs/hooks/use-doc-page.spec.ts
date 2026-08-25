// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDocPage } from './use-doc-page';

const mocks = vi.hoisted(() => ({
  getAudienceFromDocsUrl: vi.fn(),
  getDocPage: vi.fn(),
  getNextDoc: vi.fn(),
  getPreviousDoc: vi.fn(),
  pathname: '/documentation/developer/api',
  preloadDoc: vi.fn(),
  routeSlug: 'api',
}));

vi.mock('react-router', () => ({
  useLocation: () => ({ pathname: mocks.pathname }),
  useParams: () => ({ '*': mocks.routeSlug }),
}));
vi.mock('../../../../lib/docs-client', () => ({
  preloadDoc: mocks.preloadDoc,
}));
vi.mock('../../../../lib/docs-source', () => ({
  getAudienceFromDocsUrl: mocks.getAudienceFromDocsUrl,
  getDocPage: mocks.getDocPage,
  getNextDoc: mocks.getNextDoc,
  getPreviousDoc: mocks.getPreviousDoc,
}));

const page = {
  audience: 'developer',
  path: 'developer/api.mdx',
  title: 'API',
  url: '/documentation/developer/api',
};
const previousPage = {
  ...page,
  path: 'developer/index.mdx',
  title: 'Developer',
};
const nextPage = {
  ...page,
  path: 'developer/auth.mdx',
  title: 'Authentication',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

describe('useDocPage', () => {
  beforeEach(() => {
    mocks.pathname = '/documentation/developer/api';
    mocks.routeSlug = 'api';
    mocks.getAudienceFromDocsUrl.mockReset().mockReturnValue('developer');
    mocks.getDocPage.mockReset().mockReturnValue(page);
    mocks.getPreviousDoc.mockReset().mockReturnValue(previousPage);
    mocks.getNextDoc.mockReset().mockReturnValue(nextPage);
    mocks.preloadDoc.mockReset().mockResolvedValue(undefined);
  });

  it('preloads a route-derived page and exposes adjacent navigation', async () => {
    const { result } = renderHook(() =>
      useDocPage({ includeDraft: true, includeHiddenInNavigation: true }),
    );

    expect(result.current.status).toBe('loading');
    expect(result.current.isLoading).toBe(true);
    expect(mocks.getDocPage).toHaveBeenCalledWith('developer', 'api', {
      includeDraft: true,
    });
    expect(mocks.getPreviousDoc).toHaveBeenCalledWith(page, {
      includeDraft: true,
      includeHidden: true,
    });
    expect(result.current.previousPage).toBe(previousPage);
    expect(result.current.nextPage).toBe(nextPage);

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current).toMatchObject({
      audience: 'developer',
      error: undefined,
      isError: false,
      isLoading: false,
      isNotFound: false,
      isReady: true,
      page,
      path: 'developer/api.mdx',
    });
  });

  it('returns not-found without an audience or matching page', () => {
    mocks.getAudienceFromDocsUrl.mockReturnValue(undefined);
    const { result, rerender } = renderHook(() => useDocPage());

    expect(result.current.status).toBe('not-found');
    expect(result.current.isNotFound).toBe(true);
    expect(mocks.getDocPage).not.toHaveBeenCalled();
    expect(mocks.preloadDoc).not.toHaveBeenCalled();
    expect(mocks.getPreviousDoc).not.toHaveBeenCalled();

    mocks.getAudienceFromDocsUrl.mockReturnValue('user');
    mocks.getDocPage.mockReturnValue(undefined);
    rerender();
    expect(result.current.status).toBe('not-found');
  });

  it('uses explicit audience and slug values over router-derived values', async () => {
    const slug = ['api', 'tokens'] as const;
    const { result } = renderHook(() =>
      useDocPage({ audience: 'user', slug, includeHiddenInNavigation: false }),
    );

    expect(mocks.getAudienceFromDocsUrl).not.toHaveBeenCalled();
    expect(mocks.getDocPage).toHaveBeenCalledWith('user', slug, {
      includeDraft: undefined,
    });
    expect(mocks.getNextDoc).toHaveBeenCalledWith(page, {
      includeDraft: undefined,
      includeHidden: false,
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
  });

  it.each([
    [new Error('network failure'), 'network failure'],
    [' unavailable ', ' unavailable '],
    ['', 'The documentation page could not be loaded.'],
    [{ reason: 'unknown' }, 'The documentation page could not be loaded.'],
  ])('normalizes preload rejection %p', async (reason, message) => {
    mocks.preloadDoc.mockRejectedValue(reason);
    const { result } = renderHook(() => useDocPage());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe(message);
    expect(result.current.isReady).toBe(false);
  });

  it('retries the current path and ignores the previous preload result', async () => {
    const initial = deferred<void>();
    const retry = deferred<void>();
    mocks.preloadDoc
      .mockReturnValueOnce(initial.promise)
      .mockReturnValueOnce(retry.promise);
    const { result } = renderHook(() => useDocPage());

    act(() => result.current.reload());
    expect(mocks.preloadDoc).toHaveBeenCalledTimes(2);
    await act(async () => initial.resolve());
    expect(result.current.status).toBe('loading');

    await act(async () => retry.resolve());
    expect(result.current.status).toBe('ready');
  });

  it('discards a rejection after the selected document changes', async () => {
    const first = deferred<void>();
    const second = deferred<void>();
    const replacement = { ...page, path: 'developer/replacement.mdx' };
    mocks.preloadDoc
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result, rerender } = renderHook(() => useDocPage());

    mocks.getDocPage.mockReturnValue(replacement);
    mocks.routeSlug = 'replacement';
    rerender();
    await act(async () => first.reject(new Error('stale failure')));
    expect(result.current.status).toBe('loading');
    expect(result.current.error).toBeUndefined();

    await act(async () => second.resolve());
    expect(result.current.status).toBe('ready');
    expect(result.current.path).toBe('developer/replacement.mdx');
  });
});
