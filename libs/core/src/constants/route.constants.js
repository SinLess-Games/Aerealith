'use strict';
// libs/core/src/constants/route.constants.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.HealthRoute =
  exports.AuthRoute =
  exports.UserServiceRoute =
  exports.AuthServiceRoute =
  exports.ServiceRoute =
  exports.ApiRoute =
  exports.ApiVersion =
    void 0;
exports.ApiVersion = 'V1';
exports.ApiRoute = `/api/${exports.ApiVersion}`;
exports.ServiceRoute = `/${exports.ApiVersion}/services`;
exports.AuthServiceRoute = `${exports.ServiceRoute}/auth`;
exports.UserServiceRoute = `${exports.ServiceRoute}/user`;
exports.AuthRoute = `${exports.ApiRoute}/auth`;
exports.HealthRoute = '/health';
//# sourceMappingURL=route.constants.js.map
