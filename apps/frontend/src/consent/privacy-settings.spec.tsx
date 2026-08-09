// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConsentProvider, useConsent } from './consent-context';
import { PrivacySettings } from './privacy-settings';

function PrivacySettingsLauncher() {
  const consent = useConsent();

  return (
    <button type="button" onClick={consent.openSettings}>
      Privacy settings
    </button>
  );
}

describe('PrivacySettings', () => {
  beforeEach(() => {
    const values = new Map<string, string>();

    vi.stubGlobal('localStorage', {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    });
  });

  it('uses accessible switches and keeps optional consent disabled by default', () => {
    render(
      <ConsentProvider>
        <PrivacySettings />
      </ConsentProvider>,
    );

    expect(
      screen.getByRole('region', { name: 'Privacy settings' }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('switch', { name: 'Necessary data' })
        .hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen
        .getByRole('switch', { name: 'Analytics' })
        .getAttribute('aria-checked'),
    ).toBe('false');
  });

  it('saves a customized decision and dismisses the panel', () => {
    render(
      <ConsentProvider>
        <PrivacySettings />
      </ConsentProvider>,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Analytics' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save choices' }));

    expect(
      screen.queryByRole('region', { name: 'Privacy settings' }),
    ).toBeNull();
    expect(window.localStorage.getItem('aerealith-consent-v1')).toContain(
      '"analytics":true',
    );
  });

  it('accepts all optional categories', () => {
    render(
      <ConsentProvider>
        <PrivacySettings />
      </ConsentProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Accept all' }));

    const stored = window.localStorage.getItem('aerealith-consent-v1');
    expect(stored).toContain('"analytics":true');
    expect(stored).toContain('"advertising":true');
    expect(stored).toContain('"sessionReplay":true');
  });

  it('moves focus into reopened settings and restores the opening control', async () => {
    window.localStorage.setItem(
      'aerealith-consent-v1',
      JSON.stringify({
        necessary: true,
        analytics: false,
        advertising: false,
        sessionReplay: false,
      }),
    );

    render(
      <ConsentProvider>
        <PrivacySettingsLauncher />
        <PrivacySettings />
      </ConsentProvider>,
    );

    const trigger = screen.getByRole('button', { name: 'Privacy settings' });
    trigger.focus();
    fireEvent.click(trigger);

    const panel = screen.getByRole('region', { name: 'Privacy settings' });
    expect(document.activeElement).toBe(panel);

    fireEvent.click(
      screen.getByRole('button', { name: 'Close privacy settings' }),
    );

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
