// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppProviders } from '../providers/app-providers';
import { DocsLayout } from './docs-layout';

describe('DocsLayout', () => {
  const showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  const originalClose = Object.getOwnPropertyDescriptor(
    HTMLDialogElement.prototype,
    'close',
  );
  const originalShowModal = Object.getOwnPropertyDescriptor(
    HTMLDialogElement.prototype,
    'showModal',
  );

  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: showModal,
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute('open');
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    restoreDialogMethod('close', originalClose);
    restoreDialogMethod('showModal', originalShowModal);
  });

  it('returns focus to the mobile navigation trigger after Escape closes the drawer', async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/documentation/user']}>
          <Routes>
            <Route element={<DocsLayout />} path="/documentation/user/*">
              <Route element={<div>Documentation content</div>} index />
              <Route element={<Outlet />} path="*" />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppProviders>,
    );

    const trigger = screen.getByRole('button', {
      name: 'Open documentation navigation',
    });
    fireEvent.click(trigger);

    const dialog = await screen.findByRole('dialog', {
      name: 'User documentation navigation',
    });
    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });
});

function restoreDialogMethod(
  name: 'close' | 'showModal',
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
}
