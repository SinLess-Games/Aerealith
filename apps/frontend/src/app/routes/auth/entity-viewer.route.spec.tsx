// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as entityApi from '../../../features/admin/entity-api';
import { EntityViewerRoute } from './entity-viewer.route';

vi.mock('../../../features/admin/entity-api', async () => {
  const actual = await vi.importActual<typeof entityApi>(
    '../../../features/admin/entity-api',
  );
  return { ...actual, fetchEntities: vi.fn(), deleteEntity: vi.fn() };
});

const fetchEntities = vi.mocked(entityApi.fetchEntities);
const deleteEntity = vi.mocked(entityApi.deleteEntity);

function renderRoute() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <EntityViewerRoute />
    </QueryClientProvider>,
  );
}

describe('EntityViewerRoute', () => {
  afterEach(() => vi.clearAllMocks());

  it('uses a named Inspect button while preserving native table row semantics', async () => {
    fetchEntities.mockResolvedValue({
      entity: 'users',
      page: 1,
      pageSize: 25,
      total: 2,
      records: [
        { id: 'user-1', username: 'Ada', email: 'ada@example.com' },
        { id: 'user-2', username: 'Grace', email: 'grace@example.com' },
      ],
    });

    renderRoute();

    const inspectGrace = await screen.findByRole('button', {
      name: 'Inspect user Grace',
    });
    inspectGrace.focus();
    expect(document.activeElement).toBe(inspectGrace);
    fireEvent.click(inspectGrace);

    expect(inspectGrace.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('row', { name: /user-2.*Grace/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Grace' })).toBeTruthy();
  });

  it('requires an AlertDialog confirmation before deleting a record', async () => {
    fetchEntities.mockResolvedValue({
      entity: 'users',
      page: 1,
      pageSize: 25,
      total: 1,
      records: [{ id: 'user-1', username: 'Ada', email: 'ada@example.com' }],
    });
    let completeDelete: (value: null) => void = () => undefined;
    deleteEntity.mockImplementation(
      () =>
        new Promise((resolve) => {
          completeDelete = resolve;
        }),
    );

    renderRoute();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete entity' }),
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(deleteEntity).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete record' }));
    await waitFor(() =>
      expect(deleteEntity).toHaveBeenCalledWith('users', 'user-1'),
    );
    const deleteButton = screen.getByRole('button', { name: 'Deleting…' });
    expect(deleteButton.hasAttribute('disabled')).toBe(true);
    completeDelete(null);
    expect((await screen.findByRole('status')).textContent).toContain(
      'user deleted successfully',
    );
  });

  it('announces a successful ID copy', async () => {
    fetchEntities.mockResolvedValue({
      entity: 'users',
      page: 1,
      pageSize: 25,
      total: 1,
      records: [{ id: 'user-1', username: 'Ada', email: 'ada@example.com' }],
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderRoute();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Copy entity ID' }),
    );
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('user-1'));
    expect(screen.getByRole('status').textContent).toContain(
      'Entity ID copied to clipboard',
    );
  });

  it('communicates loading, empty, and retryable failure states', async () => {
    let resolveQuery: (
      value: Awaited<ReturnType<typeof fetchEntities>>,
    ) => void = () => undefined;
    fetchEntities.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveQuery = resolve;
        }),
    );

    renderRoute();

    expect(await screen.findByText('Loading users…')).toBeTruthy();
    resolveQuery({
      entity: 'users',
      page: 1,
      pageSize: 25,
      total: 0,
      records: [],
    });
    expect(await screen.findByText('No users match this search.')).toBeTruthy();

    fetchEntities.mockRejectedValueOnce(new Error('network unavailable'));
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'The entity records could not be loaded.',
    );

    fetchEntities.mockResolvedValueOnce({
      entity: 'users',
      page: 1,
      pageSize: 25,
      total: 1,
      records: [{ id: 'user-1', username: 'Ada' }],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('button', { name: 'Inspect user Ada' }),
    ).toBeTruthy();
  });
});
