import { FeatureFlag } from '@aerealith-ai/core';
import { useEffect, useRef } from 'react';

import { useConsent } from '../../consent/consent-context';
import { useFeatureFlag } from '../flags/feature-flags';
import {
  initializeBrowserObservability,
  setBrowserObservabilityPaused,
} from '../../lib/browser-observability';

export function BrowserObservabilityGate() {
  const observabilityEnabled = useFeatureFlag(FeatureFlag.Observability);
  const { hasDecision, preferences } = useConsent();
  const started = useRef(false);

  useEffect(() => {
    const allowed =
      observabilityEnabled && hasDecision && preferences.analytics;

    if (!allowed) {
      if (started.current) setBrowserObservabilityPaused(true);
      return;
    }

    if (!started.current) {
      started.current = initializeBrowserObservability();
    }

    if (started.current) setBrowserObservabilityPaused(false);
  }, [hasDecision, observabilityEnabled, preferences.analytics]);

  return null;
}

export default BrowserObservabilityGate;
