import { describe, expect, it, vi } from 'vitest';

import { createIntegrationConfig } from './integration-config';

describe('createIntegrationConfig', () => {
  it('uses safe defaults for malformed booleans and sample rates', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const config = createIntegrationConfig({
      VITE_DATADOG_ENABLED: 'perhaps',
      VITE_DATADOG_SESSION_SAMPLE_RATE: '101',
      VITE_ADSENSE_TEST_MODE: 'invalid',
    });
    expect(config.datadog.enabled).toBe(false);
    expect(config.datadog.sessionSampleRate).toBe(0);
    expect(config.adsense.testMode).toBe(true);
    warn.mockRestore();
  });

  it('keeps Cloudflare Web Analytics disabled by default', () => {
    expect(createIntegrationConfig({}).cloudflareWebAnalytics.enabled).toBe(
      false,
    );
  });
});
