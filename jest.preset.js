// Re-export Nx's shared Jest defaults so individual projects only declare
// project-specific transforms, aliases, and coverage locations.
const nxPreset = require('@nx/jest/preset').default;

module.exports = { ...nxPreset };
