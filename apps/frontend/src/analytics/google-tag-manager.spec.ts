import { afterEach, describe, expect, it } from 'vitest';

import {
  loadGoogleTagManager,
  resetGoogleTagManagerForTests,
} from './google-tag-manager';

afterEach(() => {
  resetGoogleTagManagerForTests();
  document.head
    .querySelectorAll('[data-aerealith-integration]')
    .forEach((element) => element.remove());
});

describe('loadGoogleTagManager', () => {
  it('does not load without production configuration', () => {
    expect(loadGoogleTagManager()).toBe(false);
    expect(
      document.querySelector('script[src*="googletagmanager"]'),
    ).toBeNull();
  });
});
