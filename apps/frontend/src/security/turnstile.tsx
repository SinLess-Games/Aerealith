import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { forwardRef } from 'react';

import { integrationConfig } from '../integrations/integration-config';

export const AerealithTurnstile = forwardRef<
  TurnstileInstance,
  {
    action: string;
    onToken: (token: string | null) => void;
    onError?: () => void;
  }
>(function AerealithTurnstile({ action, onToken, onError }, ref) {
  if (!integrationConfig.turnstile.siteKey) return null;

  return (
    <Turnstile
      ref={ref}
      siteKey={integrationConfig.turnstile.siteKey}
      options={{ action, theme: 'auto' }}
      onSuccess={(token) => onToken(token)}
      onExpire={() => onToken(null)}
      onError={() => {
        onToken(null);
        onError?.();
      }}
    />
  );
});

export function isTurnstileEnabled() {
  return Boolean(integrationConfig.turnstile.siteKey);
}
