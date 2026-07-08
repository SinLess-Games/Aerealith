export declare const FrontendService = 'frontend';
export declare const AuthService = 'auth';
export declare const UserService = 'user';
export declare const FrontendPort = 3000;
export declare const AuthPort = 8787;
export declare const UserPort = 8788;
export declare const ServiceNames: readonly ['frontend', 'auth', 'user'];
export type ServiceName = (typeof ServiceNames)[number];
export declare const ServicePorts: {
  readonly frontend: 3000;
  readonly auth: 8787;
  readonly user: 8788;
};
