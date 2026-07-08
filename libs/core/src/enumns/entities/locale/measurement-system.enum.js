'use strict';
// libs/core/src/enumns/entities/locale/measurement-system.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.MeasurementSystemValues =
  exports.DefaultMeasurementSystem =
  exports.MeasurementSystem =
    void 0;
exports.isMeasurementSystem = isMeasurementSystem;
/**
 * User-selectable measurement system preferences.
 */
exports.MeasurementSystem = {
  Unspecified: 'unspecified',
  Imperial: 'imperial',
  Metric: 'metric',
  Scientific: 'scientific',
};
exports.DefaultMeasurementSystem = exports.MeasurementSystem.Metric;
exports.MeasurementSystemValues = Object.values(exports.MeasurementSystem);
function isMeasurementSystem(value) {
  return (
    typeof value === 'string' && exports.MeasurementSystemValues.includes(value)
  );
}
//# sourceMappingURL=measurement-system.enum.js.map
