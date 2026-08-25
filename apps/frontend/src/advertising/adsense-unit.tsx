import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import { useConsent } from '../consent/consent-context';
import { integrationConfig } from '../integrations/integration-config';
import { loadAdsense } from './adsense-loader';

const privateRoutePrefixes = [
  '/admin',
  '/app',
  '/auth',
  '/billing',
  '/dashboard',
  '/login',
  '/register',
  '/settings',
  '/sign-in',
  '/sign-up',
];

export function isAdsenseRouteAllowed(pathname: string): boolean {
  return !privateRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function AdsenseUnit({
  slot,
  format = 'auto',
  responsive = true,
  className,
  testMode = integrationConfig.adsense.testMode,
}: Readonly<{
  slot: string;
  format?: string;
  responsive?: boolean;
  className?: string;
  testMode?: boolean;
}>) {
  const location = useLocation();
  const { preferences } = useConsent();
  const initialized = useRef(false);
  const allowed =
    preferences.advertising &&
    Boolean(integrationConfig.adsense.clientId) &&
    isAdsenseRouteAllowed(location.pathname);

  useEffect(() => {
    if (!allowed || initialized.current) return;
    loadAdsense();
    try {
      const adsenseWindow = window as unknown as {
        adsbygoogle?: Array<Record<string, never>>;
      };
      adsenseWindow.adsbygoogle ??= [];
      adsenseWindow.adsbygoogle.push({});
      initialized.current = true;
    } catch (error) {
      if (integrationConfig.environment.isDevelopment)
        console.warn('[adsense] initialization failed', error);
    }
  }, [allowed]);

  if (!allowed) return null;

  return (
    <ins
      className={`adsbygoogle ${className ?? ''}`.trim()}
      style={{ display: 'block' }}
      data-ad-client={integrationConfig.adsense.clientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
      data-adtest={testMode ? 'on' : undefined}
    />
  );
}
