// libs/core/src/constants/route.constants.ts

export const ApiVersion = 'V1';

export const ApiRoute = `/api/${ApiVersion}`;
export const ServiceRoute = `/${ApiVersion}/services`;

export const AuthServiceRoute = `${ServiceRoute}/auth`;
export const UserServiceRoute = `${ServiceRoute}/user`;

export const AuthRoute = `${ApiRoute}/auth`;
export const HealthRoute = '/health';