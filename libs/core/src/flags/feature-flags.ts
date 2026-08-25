export const FlagshipApplicationId = '2a1ca9ba-b446-4cb8-b8eb-ab0f3985679f';

export const FeatureFlag = {
  MaintenanceMode: 'maintenance-mode',
  Observability: 'observability',
  Onboarding: 'onboarding',
  Dashboard: 'dashboard',
  Pricing: 'pricing',
  Billing: 'billing',
  Authentication: 'authentication',
  Registration: 'registration',
  Waitlist: 'waitlist',
} as const;

export type FeatureFlagKey = (typeof FeatureFlag)[keyof typeof FeatureFlag];

/** Safe fallbacks mirror the defaults configured in Cloudflare Flagship. */
export const FeatureFlagDefaults = {
  [FeatureFlag.MaintenanceMode]: false,
  [FeatureFlag.Observability]: false,
  [FeatureFlag.Onboarding]: true,
  [FeatureFlag.Dashboard]: true,
  [FeatureFlag.Pricing]: true,
  [FeatureFlag.Billing]: false,
  [FeatureFlag.Authentication]: true,
  [FeatureFlag.Registration]: false,
  [FeatureFlag.Waitlist]: false,
} as const satisfies Record<FeatureFlagKey, boolean>;

export type FeatureFlagValues = Record<FeatureFlagKey, boolean>;

export type FeatureFlagContext = Record<string, string | number | boolean>;

/** Structural subset implemented by a Cloudflare Flagship Worker binding. */
export interface BooleanFeatureFlagProvider {
  getBooleanValue(
    flagKey: string,
    defaultValue: boolean,
    context?: FeatureFlagContext,
  ): Promise<boolean>;
}

export const AllFeatureFlagKeys = Object.values(FeatureFlag);

export async function resolveFeatureFlags(
  provider: BooleanFeatureFlagProvider | undefined,
  context?: FeatureFlagContext,
): Promise<FeatureFlagValues> {
  const entries = await Promise.all(
    AllFeatureFlagKeys.map(async (key) => {
      const fallback = FeatureFlagDefaults[key];
      if (!provider) return [key, fallback] as const;

      try {
        return [
          key,
          await provider.getBooleanValue(key, fallback, context),
        ] as const;
      } catch {
        return [key, fallback] as const;
      }
    }),
  );

  return Object.fromEntries(entries) as FeatureFlagValues;
}
