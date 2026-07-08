'use strict';
// libs/core/src/enumns/system/app-environment.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.AppEnvironmentValues =
  exports.DefaultAppEnvironment =
  exports.AppEnvironment =
    void 0;
exports.isAppEnvironment = isAppEnvironment;
/**
 * Application runtime environment values.
 */
exports.AppEnvironment = {
  Local: 'local',
  Development: 'development',
  Test: 'test',
  Preview: 'preview',
  Staging: 'staging',
  Production: 'production',
};
exports.DefaultAppEnvironment = exports.AppEnvironment.Development;
exports.AppEnvironmentValues = Object.values(exports.AppEnvironment);
function isAppEnvironment(value) {
  return (
    typeof value === 'string' && exports.AppEnvironmentValues.includes(value)
  );
}
//# sourceMappingURL=app-environment.enum.js.map
