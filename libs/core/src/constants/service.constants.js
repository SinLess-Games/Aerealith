'use strict';
// libs/core/src/constants/service.constants.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.ServicePorts =
  exports.ServiceNames =
  exports.UserPort =
  exports.AuthPort =
  exports.FrontendPort =
  exports.UserService =
  exports.AuthService =
  exports.FrontendService =
    void 0;
exports.FrontendService = 'frontend';
exports.AuthService = 'auth';
exports.UserService = 'user';
exports.FrontendPort = 3000;
exports.AuthPort = 8787;
exports.UserPort = 8788;
exports.ServiceNames = [
  exports.FrontendService,
  exports.AuthService,
  exports.UserService,
];
exports.ServicePorts = {
  [exports.FrontendService]: exports.FrontendPort,
  [exports.AuthService]: exports.AuthPort,
  [exports.UserService]: exports.UserPort,
};
//# sourceMappingURL=service.constants.js.map
