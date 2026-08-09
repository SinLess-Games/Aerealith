import { describe, expect, it } from 'vitest';

import { sanitizedPath } from './route-tracker';

describe('sanitizedPath', () => {
  it('removes sensitive query parameters', () => {
    expect(
      sanitizedPath('/verify-email', '?token=secret&campaign=launch'),
    ).toBe('/verify-email?campaign=launch');
  });
});
