// libs/utils/src/ui/index.ts

export {
  joinAriaIds,
  requireAccessibleLabel,
  toAriaBoolean,
  toAriaChecked,
  type AriaIdReference,
} from './a11y';

export {
  blendColors,
  clampAlpha,
  clampColorChannel,
  getContrastRatio,
  getReadableForeground,
  getRelativeLuminance,
  hasContrastRatio,
  hexToRgb,
  hexToRgba,
  isHexColor,
  rgbaToHex,
  rgbToHex,
  toCssColorWithAlpha,
  toCssRgb,
  toCssRgba,
  type ReadableForeground,
  type RgbaColor,
  type RgbColor,
} from './color';

export {
  formatKeyboardShortcut,
  hasPrimaryModifier,
  isApplePlatform,
  isEditableTarget,
  matchesKeyboardShortcut,
  normalizeKeyboardKey,
  preventDefaultForShortcut,
  type KeyboardEventLike,
  type KeyboardShortcut,
  type KeyboardShortcutMatchOptions,
  type KeyboardShortcutModifier,
} from './keyboard';

export {
  formatCount,
  formatTextList,
  getFirstTextValue,
  getInitials,
  humanizeIdentifier,
  pluralize,
  toSlug,
  truncateText,
  type TextListOptions,
} from './text';
