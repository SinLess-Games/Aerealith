export const FlagshipApplicationId = '2a1ca9ba-b446-4cb8-b8eb-ab0f3985679f';

export const FeatureFlag = {
  MaintenanceMode: 'maintenance-mode',
  Observability: 'observability',
  Onboarding: 'onboarding',
  Dashboard: 'dashboard',
  Documentation: 'documentation',
  Account: 'account',
  Profile: 'profile',
  Security: 'security',
  Admin: 'admin',
  Pricing: 'pricing',
  Billing: 'billing',
  Authentication: 'authentication',
  Registration: 'registration',
  Waitlist: 'waitlist',

  // AI Studio release controls. Backend capability discovery still decides
  // whether a model/provider can actually execute a capability; these flags
  // control product exposure and rollout.
  AiStudio: 'ai-studio',
  AiChat: 'ai-chat',
  AiStreaming: 'ai-streaming',
  AiModelSelector: 'ai-model-selector',
  AiCode: 'ai-code',
  AiImage: 'ai-image',
  AiAudio: 'ai-audio',
  AiVideo: 'ai-video',
  AiMusic: 'ai-music',
  AiAnalytics: 'ai-analytics',
  AiPrediction: 'ai-prediction',
  AiKnowledge: 'ai-knowledge',
  AiTools: 'ai-tools',
} as const;

export type FeatureFlagKey = (typeof FeatureFlag)[keyof typeof FeatureFlag];

/** Safe fallbacks mirror the defaults configured in Cloudflare Flagship. */
export const FeatureFlagDefaults = {
  [FeatureFlag.MaintenanceMode]: false,
  [FeatureFlag.Observability]: false,
  [FeatureFlag.Onboarding]: true,
  [FeatureFlag.Dashboard]: true,
  [FeatureFlag.Documentation]: true,
  [FeatureFlag.Account]: true,
  [FeatureFlag.Profile]: true,
  [FeatureFlag.Security]: true,
  [FeatureFlag.Admin]: true,
  [FeatureFlag.Pricing]: true,
  [FeatureFlag.Billing]: false,
  [FeatureFlag.Authentication]: true,
  [FeatureFlag.Registration]: false,
  [FeatureFlag.Waitlist]: false,

  // AI is fail-closed until the corresponding Flagship flags exist and are
  // explicitly enabled for the desired rollout audience.
  [FeatureFlag.AiStudio]: false,
  [FeatureFlag.AiChat]: false,
  [FeatureFlag.AiStreaming]: false,
  [FeatureFlag.AiModelSelector]: false,
  [FeatureFlag.AiCode]: false,
  [FeatureFlag.AiImage]: false,
  [FeatureFlag.AiAudio]: false,
  [FeatureFlag.AiVideo]: false,
  [FeatureFlag.AiMusic]: false,
  [FeatureFlag.AiAnalytics]: false,
  [FeatureFlag.AiPrediction]: false,
  [FeatureFlag.AiKnowledge]: false,
  [FeatureFlag.AiTools]: false,
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
