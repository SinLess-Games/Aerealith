// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockIntegrationConfig } = vi.hoisted(() => ({
  mockIntegrationConfig: { googleSiteVerification: '' },
}));

vi.mock('./integration-config', () => ({
  integrationConfig: mockIntegrationConfig,
}));

import { SearchConsoleVerification } from './search-console-verification';

describe('SearchConsoleVerification', () => {
  beforeEach(() => {
    mockIntegrationConfig.googleSiteVerification = '';
  });

  afterEach(() => cleanup());

  it('omits the verification element when configuration is empty', () => {
    render(<SearchConsoleVerification />);
    expect(
      document.head.querySelector('meta[name="google-site-verification"]'),
    ).toBeNull();
  });

  it('adds and removes the configured verification element', () => {
    mockIntegrationConfig.googleSiteVerification = 'site-token';
    const view = render(<SearchConsoleVerification />);

    const meta = document.head.querySelector<HTMLMetaElement>(
      'meta[name="google-site-verification"]',
    );
    expect(meta?.content).toBe('site-token');
    expect(meta?.dataset['aerealithIntegration']).toBe(
      'google-site-verification',
    );

    view.unmount();
    expect(
      document.head.querySelector('meta[name="google-site-verification"]'),
    ).toBeNull();
  });
});
