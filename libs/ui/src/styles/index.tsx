// libs/ui/src/styles/index.ts

import colors from './colors.css?url';
import fonts from './fonts.css?url';
import globals from './globals.css?url';
import themes from './themes.css?url';
import typography from './typography.css?url';
import utilities from './utilities.css?url';
import accessibility from './accessibility.css?url';
import highContrast from './high-contrast.css?url';
import readingComfort from './reading-comfort.css?url';
import reducedMotion from './reduced-motion.css?url';

/**
 * Aerealith UI stylesheet asset URLs.
 *
 * Use `all` for the complete design-system stylesheet bundle when importing
 * through a bundler that supports Vite asset URLs.
 */
export const AerealithStyles = {
  accessibility,
  colors,
  fonts,
  globals,
  highContrast,
  readingComfort,
  reducedMotion,
  themes,
  typography,
  utilities,
} as const;

/**
 * Stylesheet import order for consumers that need to load each stylesheet
 * individually.
 */
export const AerealithStyleOrder = [
  AerealithStyles.colors,
  AerealithStyles.themes,
  AerealithStyles.fonts,
  AerealithStyles.typography,
  AerealithStyles.globals,
  AerealithStyles.utilities,
  AerealithStyles.accessibility,
  AerealithStyles.highContrast,
  AerealithStyles.readingComfort,
  AerealithStyles.reducedMotion,
] as const;

export type AerealithStyleName = keyof typeof AerealithStyles;
