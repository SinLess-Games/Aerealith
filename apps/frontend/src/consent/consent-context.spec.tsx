// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConsentProvider, useConsent } from './consent-context';

function Consumer() {
  const consent = useConsent();
  return (
    <>
      <span>{String(consent.preferences.analytics)}</span>
      <button type="button" onClick={consent.acceptAll}>
        Accept
      </button>
    </>
  );
}

describe('ConsentProvider', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    });
  });

  it('defaults optional categories to denied and persists a decision', () => {
    render(
      <ConsentProvider>
        <Consumer />
      </ConsentProvider>,
    );
    expect(screen.getByText('false')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    expect(screen.getByText('true')).toBeTruthy();
    expect(window.localStorage.getItem('aerealith-consent-v1')).toContain(
      '"analytics":true',
    );
  });
});
