// libs/core/src/enumns/system/app-environment.enum.ts

/**
 * Application runtime environment values.
 */
export const AppEnvironment = {
  Local: 'local',
  Development: 'development',
  Test: 'test',
  Preview: 'preview',
  Staging: 'staging',
  Production: 'production',
} as const

export type AppEnvironment =
  (typeof AppEnvironment)[keyof typeof AppEnvironment]

export const DefaultAppEnvironment = AppEnvironment.Development

export const AppEnvironmentValues = Object.values(AppEnvironment)

export function isAppEnvironment(value: unknown): value is AppEnvironment {
  return (
    typeof value === 'string' &&
    AppEnvironmentValues.includes(value as AppEnvironment)
  )
}
