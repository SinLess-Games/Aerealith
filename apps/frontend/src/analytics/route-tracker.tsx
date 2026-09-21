import { FeatureFlag } from '@aerealith-ai/core';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import { useConsent } from '../consent/consent-context';
import { useFeatureFlag } from '../features/flags/feature-flags';
import { trackDatadogView } from '../observability/datadog-rum';
import { trackEvent } from './google-tag-manager';

const sensitiveParameters = new Set([
  'token',
  'code',
  'key',
  'password',
  'secret',
  'session',
  'email',
]);

export function sanitizedPath(pathname: string, search: string): string {
  const parameters = new URLSearchParams(search);
  const keysToDelete = new Set<string>();
  parameters.forEach((_value, key) => {
    if (sensitiveParameters.has(key.toLowerCase())) keysToDelete.add(key);
  });
  keysToDelete.forEach((key) => parameters.delete(key));
  const sanitized = parameters.toString();
  return sanitized ? `${pathname}?${sanitized}` : pathname;
}

export function RouteTracker() {
  const location = useLocation();
  const { preferences } = useConsent();
  const observabilityEnabled = useFeatureFlag(FeatureFlag.Observability);
  const previous = useRef('');

  useEffect(() => {
    if (!preferences.analytics) return;
    const path = sanitizedPath(location.pathname, location.search);
    if (previous.current === path) return;
    previous.current = path;
    trackEvent({
      event: 'page_view',
      page_path: path,
      page_title: document.title,
    });
    if (observabilityEnabled) trackDatadogView(path);
  }, [
    location.pathname,
    location.search,
    observabilityEnabled,
    preferences.analytics,
  ]);

  return null;
}
