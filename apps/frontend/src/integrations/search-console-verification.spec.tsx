// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SearchConsoleVerification } from './search-console-verification';

describe('SearchConsoleVerification', () => {
  it('omits the verification element when configuration is empty', () => {
    render(<SearchConsoleVerification />);
    expect(
      document.head.querySelector('meta[name="google-site-verification"]'),
    ).toBeNull();
  });
});
