import { describe, expect, it } from 'vitest';

import { sanitizedPath } from './route-tracker';

describe('sanitizedPath', () => {
  it('removes sensitive query parameters', () => {
    expect(
      sanitizedPath(
        '/verify-email',
        '?token=secret&code=private&campaign=launch',
      ),
    ).toBe('/verify-email?campaign=launch');
  });

  it('omits the query delimiter when no public parameters remain', () => {
    expect(sanitizedPath('/reset-password', '?token=secret')).toBe(
      '/reset-password',
    );
  });
});
