import { describe, expect, it } from 'vitest';

import { isAdsenseRouteAllowed } from './adsense-unit';

describe('isAdsenseRouteAllowed', () => {
  it('blocks private and authentication routes', () => {
    expect(isAdsenseRouteAllowed('/app')).toBe(false);
    expect(isAdsenseRouteAllowed('/app/account')).toBe(false);
    expect(isAdsenseRouteAllowed('/sign-in')).toBe(false);
  });

  it('allows public content routes', () => {
    expect(isAdsenseRouteAllowed('/docs/getting-started')).toBe(true);
  });
});
