// libs/core/src/constants/service.constants.ts

export const FrontendService = 'frontend';
export const AuthService = 'auth';
export const UserService = 'user';

export const FrontendPort = 3000;
export const AuthPort = 8787;
export const UserPort = 8788;

export const ServiceNames = [
  FrontendService,
  AuthService,
  UserService,
] as const;

export type ServiceName = (typeof ServiceNames)[number];

export const ServicePorts = {
  [FrontendService]: FrontendPort,
  [AuthService]: AuthPort,
  [UserService]: UserPort,
} as const satisfies Record<ServiceName, number>;