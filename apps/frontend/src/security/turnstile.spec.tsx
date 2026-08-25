// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AerealithTurnstile, isTurnstileEnabled } from './turnstile';

const mocks = vi.hoisted(() => ({
  config: { turnstile: { siteKey: 'site-key' } },
  props: undefined as
    | {
        onError: () => void;
        onExpire: () => void;
        onSuccess: (token: string) => void;
        options: { action: string; theme: string };
        siteKey: string;
      }
    | undefined,
}));

vi.mock('../integrations/integration-config', () => ({
  integrationConfig: mocks.config,
}));
vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: (props: NonNullable<typeof mocks.props>) => {
    mocks.props = props;
    return <div data-testid="turnstile" />;
  },
}));

describe('AerealithTurnstile', () => {
  beforeEach(() => {
    mocks.config.turnstile.siteKey = 'site-key';
    mocks.props = undefined;
  });

  it('is disabled and renders nothing without a site key', () => {
    mocks.config.turnstile.siteKey = '';
    const { container } = render(
      <AerealithTurnstile action="sign-in" onToken={vi.fn()} />,
    );

    expect(isTurnstileEnabled()).toBe(false);
    expect(container.innerHTML).toBe('');
  });

  it('forwards configuration and token lifecycle callbacks', () => {
    const onToken = vi.fn();
    const onError = vi.fn();
    const { getByTestId } = render(
      <AerealithTurnstile
        action="register"
        onToken={onToken}
        onError={onError}
      />,
    );

    expect(isTurnstileEnabled()).toBe(true);
    expect(getByTestId('turnstile')).toBeTruthy();
    expect(mocks.props).toMatchObject({
      options: { action: 'register', theme: 'auto' },
      siteKey: 'site-key',
    });

    mocks.props!.onSuccess('verified-token');
    mocks.props!.onExpire();
    mocks.props!.onError();
    expect(onToken).toHaveBeenNthCalledWith(1, 'verified-token');
    expect(onToken).toHaveBeenNthCalledWith(2, null);
    expect(onToken).toHaveBeenNthCalledWith(3, null);
    expect(onError).toHaveBeenCalled();
  });

  it('handles Turnstile errors when no optional error callback is supplied', () => {
    const onToken = vi.fn();
    render(<AerealithTurnstile action="contact" onToken={onToken} />);

    expect(() => mocks.props!.onError()).not.toThrow();
    expect(onToken).toHaveBeenCalledWith(null);
  });
});
