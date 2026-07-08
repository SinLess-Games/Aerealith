/**
 * Service health states.
 */
export declare const ServiceHealthStatus: {
  readonly Healthy: 'healthy';
  readonly Degraded: 'degraded';
  readonly Unhealthy: 'unhealthy';
};
export type ServiceHealthStatus =
  (typeof ServiceHealthStatus)[keyof typeof ServiceHealthStatus];
/**
 * Basic health response for a running service.
 */
export type HealthContract = {
  status: ServiceHealthStatus;
  service: string;
  timestamp: string;
};
/**
 * Health state for a service dependency.
 */
export type DependencyHealthContract = {
  status: ServiceHealthStatus;
  message?: string;
};
/**
 * Readiness response including required dependencies.
 */
export type ReadinessContract = HealthContract & {
  dependencies: Record<string, DependencyHealthContract>;
};
