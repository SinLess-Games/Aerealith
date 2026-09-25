import { describe, expect, it, vi } from 'vitest';

import { createIntegrationConfig } from './integration-config';

describe('createIntegrationConfig', () => {
  it('uses safe defaults for malformed booleans', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const config = createIntegrationConfig({
      VITE_ADSENSE_TEST_MODE: 'invalid',
      VITE_CLOUDFLARE_WEB_ANALYTICS_ENABLED: 'perhaps',
    });

    expect(config.adsense.testMode).toBe(true);
    expect(config.cloudflareWebAnalytics.enabled).toBe(false);
    warn.mockRestore();
  });

  it('keeps Cloudflare Web Analytics disabled by default', () => {
    expect(createIntegrationConfig({}).cloudflareWebAnalytics.enabled).toBe(
      false,
    );
  });
});
