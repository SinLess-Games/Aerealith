import { FeatureFlag } from '@aerealith-ai/core';
import { useEffect, useRef } from 'react';

import { useConsent } from '../../consent/consent-context';
import { useFeatureFlag } from '../flags/feature-flags';
import { initializeBrowserObservability } from '../../lib/browser-observability';

export function BrowserObservabilityGate() {
  const observabilityEnabled = useFeatureFlag(FeatureFlag.Observability);
  const { hasDecision, preferences } = useConsent();
  const started = useRef(false);

  useEffect(() => {
    if (
      started.current ||
      !observabilityEnabled ||
      !hasDecision ||
      !preferences.analytics
    ) {
      return;
    }

    started.current = initializeBrowserObservability();
  }, [hasDecision, observabilityEnabled, preferences.analytics]);

  return null;
}

export default BrowserObservabilityGate;
