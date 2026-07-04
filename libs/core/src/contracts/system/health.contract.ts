// libs/core/src/contracts/system/health.contract.ts

import type { IsoDateString } from '../api.contract'

/**
 * Service health states.
 */
export const ServiceHealthStatus = {
  Healthy: 'healthy',
  Degraded: 'degraded',
  Unhealthy: 'unhealthy',
} as const

export type ServiceHealthStatus =
  (typeof ServiceHealthStatus)[keyof typeof ServiceHealthStatus]

/**
 * Basic health response for a running service.
 */
export type HealthContract = {
  status: ServiceHealthStatus
  service: string
  timestamp: IsoDateString
}

/**
 * Health state for a service dependency.
 */
export type DependencyHealthContract = {
  status: ServiceHealthStatus
  message?: string
}

/**
 * Readiness response including required dependencies.
 */
export type ReadinessContract = HealthContract & {
  dependencies: Record<string, DependencyHealthContract>
}
