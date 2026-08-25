import { describe, expect, it, vi } from 'vitest';

import {
  AllFeatureFlagKeys,
  FeatureFlag,
  FeatureFlagDefaults,
  FlagshipApplicationId,
  resolveFeatureFlags,
} from './feature-flags';

describe('feature flags', () => {
  it('defines the Cloudflare app and every dashboard flag', () => {
    expect(FlagshipApplicationId).toBe('2a1ca9ba-b446-4cb8-b8eb-ab0f3985679f');
    expect(AllFeatureFlagKeys).toEqual([
      'maintenance-mode',
      'observability',
      'onboarding',
      'dashboard',
      'pricing',
      'billing',
      'authentication',
      'registration',
      'waitlist',
    ]);
  });

  it('uses the configured safe defaults without a provider', async () => {
    await expect(resolveFeatureFlags(undefined)).resolves.toEqual(
      FeatureFlagDefaults,
    );
  });

  it('evaluates every flag with context and its individual fallback', async () => {
    const getBooleanValue = vi.fn(
      async (key: string) => key === FeatureFlag.Billing,
    );
    const context = { userId: 'user-42', plan: 'pro' };
    const values = await resolveFeatureFlags({ getBooleanValue }, context);

    expect(values[FeatureFlag.Billing]).toBe(true);
    expect(values[FeatureFlag.Pricing]).toBe(false);
    expect(getBooleanValue).toHaveBeenCalledTimes(AllFeatureFlagKeys.length);
    expect(getBooleanValue).toHaveBeenCalledWith(
      FeatureFlag.Registration,
      false,
      context,
    );
  });

  it('falls back per flag when evaluation fails', async () => {
    const values = await resolveFeatureFlags({
      getBooleanValue: vi.fn(async () => {
        throw new Error('Flagship unavailable');
      }),
    });
    expect(values).toEqual(FeatureFlagDefaults);
  });
});
