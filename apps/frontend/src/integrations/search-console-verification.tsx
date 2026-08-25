import { useEffect } from 'react';

import { integrationConfig } from './integration-config';

export function SearchConsoleVerification() {
  useEffect(() => {
    const value = integrationConfig.googleSiteVerification;
    if (!value) return;
    const meta = document.createElement('meta');
    meta.name = 'google-site-verification';
    meta.content = value;
    meta.dataset['aerealithIntegration'] = 'google-site-verification';
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);

  return null;
}
