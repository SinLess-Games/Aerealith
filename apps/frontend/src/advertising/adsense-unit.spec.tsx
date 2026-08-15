// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdsenseUnit, isAdsenseRouteAllowed } from './adsense-unit';

const mocks = vi.hoisted(() => ({
  config: {
    adsense: { clientId: 'ca-pub-123', testMode: true },
    environment: { isDevelopment: true },
  },
  loadAdsense: vi.fn(),
  preferences: { advertising: true },
}));

vi.mock('../consent/consent-context', () => ({
  useConsent: () => ({ preferences: mocks.preferences }),
}));
vi.mock('../integrations/integration-config', () => ({
  integrationConfig: mocks.config,
}));
vi.mock('./adsense-loader', () => ({ loadAdsense: mocks.loadAdsense }));

function renderUnit(pathname = '/pricing', props = {}) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <AdsenseUnit slot="hero" {...props} />
    </MemoryRouter>,
  );
}

describe('AdsenseUnit', () => {
  beforeEach(() => {
    mocks.preferences.advertising = true;
    mocks.config.adsense.clientId = 'ca-pub-123';
    mocks.config.adsense.testMode = true;
    mocks.config.environment.isDevelopment = true;
    mocks.loadAdsense.mockReset();
    delete (window as typeof window & { adsbygoogle?: unknown }).adsbygoogle;
  });

  afterEach(() => vi.restoreAllMocks());

  it.each([
    ['/auth', false],
    ['/auth/sign-in', false],
    ['/dashboard/team', false],
    ['/pricing', true],
    ['/authentication-guide', true],
  ])('classifies route %s as allowed=%s', (pathname, allowed) => {
    expect(isAdsenseRouteAllowed(pathname)).toBe(allowed);
  });

  it('does not render without advertising consent, a client ID, or a public route', () => {
    mocks.preferences.advertising = false;
    const { container, unmount } = renderUnit();
    expect(container.querySelector('ins')).toBeNull();
    unmount();

    mocks.preferences.advertising = true;
    mocks.config.adsense.clientId = '';
    expect(renderUnit().container.querySelector('ins')).toBeNull();

    mocks.config.adsense.clientId = 'ca-pub-123';
    expect(renderUnit('/settings').container.querySelector('ins')).toBeNull();
    expect(mocks.loadAdsense).not.toHaveBeenCalled();
  });

  it('renders configured attributes and initializes an ad exactly once', async () => {
    const { container, rerender } = renderUnit('/pricing', {
      className: 'hero-ad',
      format: 'rectangle',
      responsive: false,
      testMode: false,
    });

    const unit = container.querySelector('ins')!;
    expect(unit.className).toBe('adsbygoogle hero-ad');
    expect(unit.dataset['adClient']).toBe('ca-pub-123');
    expect(unit.dataset['adSlot']).toBe('hero');
    expect(unit.dataset['adFormat']).toBe('rectangle');
    expect(unit.dataset['fullWidthResponsive']).toBe('false');
    expect(unit.hasAttribute('data-adtest')).toBe(false);

    await waitFor(() => expect(mocks.loadAdsense).toHaveBeenCalledTimes(1));
    expect(
      (window as typeof window & { adsbygoogle: unknown[] }).adsbygoogle,
    ).toEqual([{}]);

    rerender(
      <MemoryRouter initialEntries={['/pricing']}>
        <AdsenseUnit slot="hero" />
      </MemoryRouter>,
    );
    expect(mocks.loadAdsense).toHaveBeenCalledTimes(1);
  });

  it('reports initialization failures only during development', async () => {
    const warning = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    Object.defineProperty(window, 'adsbygoogle', {
      configurable: true,
      value: {
        push: vi.fn(() => {
          throw new Error('blocked');
        }),
      },
      writable: true,
    });
    renderUnit();
    await waitFor(() =>
      expect(warning).toHaveBeenCalledWith(
        '[adsense] initialization failed',
        expect.any(Error),
      ),
    );

    warning.mockClear();
    mocks.config.environment.isDevelopment = false;
    renderUnit('/about');
    await waitFor(() => expect(mocks.loadAdsense).toHaveBeenCalledTimes(2));
    expect(warning).not.toHaveBeenCalled();
  });
});
