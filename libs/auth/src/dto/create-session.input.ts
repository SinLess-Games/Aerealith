import type { UserSessionGeoIp } from '@aerealith-ai/core';

export interface CreateSessionInput {
  readonly userId: string;
  readonly deviceName?: string | null;
  readonly userAgent?: string | null;
  readonly ipAddress?: string | null;
  readonly geoIp?: UserSessionGeoIp | null;
}
