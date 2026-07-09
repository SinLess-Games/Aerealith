// libs/utils/src/ui/color.ts

/**
 * An RGB color with channels in the inclusive range of 0 to 255.
 */
export interface RgbColor {
  readonly red: number
  readonly green: number
  readonly blue: number
}

/**
 * An RGBA color with an alpha channel in the inclusive range of 0 to 1.
 */
export interface RgbaColor extends RgbColor {
  readonly alpha: number
}

/**
 * Common foreground color recommendations for contrast checks.
 */
export type ReadableForeground = 'black' | 'white'

/**
 * Clamps a color channel to the inclusive range of 0 to 255.
 */
export function clampColorChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)))
}

/**
 * Clamps an alpha value to the inclusive range of 0 to 1.
 */
export function clampAlpha(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/**
 * Returns whether a value is a supported hexadecimal color.
 *
 * Supported formats:
 * - #RGB
 * - #RGBA
 * - #RRGGBB
 * - #RRGGBBAA
 *
 * @example
 * isHexColor('#F6066F');
 * // true
 */
export function isHexColor(value: string): boolean {
  return /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
}

/**
 * Converts a hexadecimal color into RGBA channels.
 *
 * Returns `undefined` for unsupported color values.
 *
 * @example
 * hexToRgba('#F6066F');
 * // { red: 246, green: 6, blue: 111, alpha: 1 }
 */
export function hexToRgba(value: string): RgbaColor | undefined {
  const normalizedValue = value.trim()

  if (!isHexColor(normalizedValue)) {
    return undefined
  }

  const hex = normalizedValue.slice(1)
  const expandedHex = expandShortHex(hex)

  const red = Number.parseInt(expandedHex.slice(0, 2), 16)
  const green = Number.parseInt(expandedHex.slice(2, 4), 16)
  const blue = Number.parseInt(expandedHex.slice(4, 6), 16)
  const alphaHex = expandedHex.slice(6, 8)

  return {
    red,
    green,
    blue,
    alpha: alphaHex.length === 2 ? Number.parseInt(alphaHex, 16) / 255 : 1,
  }
}

/**
 * Converts a hexadecimal color into RGB channels.
 *
 * Returns `undefined` for unsupported color values.
 *
 * @example
 * hexToRgb('#00DBC9');
 * // { red: 0, green: 219, blue: 201 }
 */
export function hexToRgb(value: string): RgbColor | undefined {
  const color = hexToRgba(value)

  if (!color) {
    return undefined
  }

  return {
    red: color.red,
    green: color.green,
    blue: color.blue,
  }
}

/**
 * Converts RGB channels into a six-character hexadecimal color.
 *
 * @example
 * rgbToHex({ red: 246, green: 6, blue: 111 });
 * // '#f6066f'
 */
export function rgbToHex(color: RgbColor): string {
  return `#${toHexChannel(color.red)}${toHexChannel(color.green)}${toHexChannel(
    color.blue,
  )}`
}

/**
 * Converts RGBA channels into an eight-character hexadecimal color.
 *
 * @example
 * rgbaToHex({ red: 246, green: 6, blue: 111, alpha: 0.5 });
 * // '#f6066f80'
 */
export function rgbaToHex(color: RgbaColor): string {
  return `${rgbToHex(color)}${toHexChannel(color.alpha * 255)}`
}

/**
 * Converts an RGB color into a CSS `rgb()` value.
 *
 * @example
 * toCssRgb({ red: 0, green: 219, blue: 201 });
 * // 'rgb(0 219 201)'
 */
export function toCssRgb(color: RgbColor): string {
  return `rgb(${clampColorChannel(color.red)} ${clampColorChannel(
    color.green,
  )} ${clampColorChannel(color.blue)})`
}

/**
 * Converts an RGB color and alpha value into a CSS `rgb()` color value.
 *
 * @example
 * toCssColorWithAlpha({ red: 0, green: 219, blue: 201 }, 0.2);
 * // 'rgb(0 219 201 / 20%)'
 */
export function toCssColorWithAlpha(color: RgbColor, alpha: number): string {
  return `rgb(${clampColorChannel(color.red)} ${clampColorChannel(
    color.green,
  )} ${clampColorChannel(color.blue)} / ${formatAlpha(alpha)})`
}

/**
 * Converts an RGBA color into a CSS `rgb()` value.
 *
 * @example
 * toCssRgba({ red: 140, green: 82, blue: 255, alpha: 0.25 });
 * // 'rgb(140 82 255 / 25%)'
 */
export function toCssRgba(color: RgbaColor): string {
  return toCssColorWithAlpha(color, color.alpha)
}

/**
 * Calculates the relative luminance required by WCAG contrast calculations.
 *
 * The returned value is between 0 and 1.
 */
export function getRelativeLuminance(color: RgbColor): number {
  const red = linearizeColorChannel(color.red)
  const green = linearizeColorChannel(color.green)
  const blue = linearizeColorChannel(color.blue)

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

/**
 * Calculates the WCAG contrast ratio between two RGB colors.
 *
 * A value of:
 * - 4.5 or higher generally meets WCAG AA for normal text.
 * - 3 or higher generally meets WCAG AA for large text.
 * - 7 or higher generally meets WCAG AAA for normal text.
 *
 * @example
 * getContrastRatio(
 *   { red: 247, green: 244, blue: 255 },
 *   { red: 5, green: 10, blue: 30 },
 * );
 * // 18.65...
 */
export function getContrastRatio(
  firstColor: RgbColor,
  secondColor: RgbColor,
): number {
  const firstLuminance = getRelativeLuminance(firstColor)
  const secondLuminance = getRelativeLuminance(secondColor)

  const lighter = Math.max(firstLuminance, secondLuminance)
  const darker = Math.min(firstLuminance, secondLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Returns whether two colors meet a desired WCAG contrast ratio.
 *
 * @example
 * hasContrastRatio(foreground, background, 4.5);
 * // true
 */
export function hasContrastRatio(
  foreground: RgbColor,
  background: RgbColor,
  minimumRatio = 4.5,
): boolean {
  return getContrastRatio(foreground, background) >= minimumRatio
}

/**
 * Chooses either black or white as the most readable foreground color
 * for the supplied background color.
 *
 * @example
 * getReadableForeground({ red: 5, green: 10, blue: 30 });
 * // 'white'
 */
export function getReadableForeground(
  background: RgbColor,
): ReadableForeground {
  const black: RgbColor = {
    red: 0,
    green: 0,
    blue: 0,
  }

  const white: RgbColor = {
    red: 255,
    green: 255,
    blue: 255,
  }

  const blackContrast = getContrastRatio(black, background)
  const whiteContrast = getContrastRatio(white, background)

  return whiteContrast >= blackContrast ? 'white' : 'black'
}

/**
 * Blends a foreground color over a background color using an alpha value.
 *
 * This is useful when checking the real contrast of translucent UI surfaces.
 *
 * @example
 * blendColors(
 *   { red: 0, green: 219, blue: 201 },
 *   { red: 5, green: 10, blue: 30 },
 *   0.2,
 * );
 */
export function blendColors(
  foreground: RgbColor,
  background: RgbColor,
  alpha: number,
): RgbColor {
  const normalizedAlpha = clampAlpha(alpha)
  const inverseAlpha = 1 - normalizedAlpha

  return {
    red: clampColorChannel(
      foreground.red * normalizedAlpha + background.red * inverseAlpha,
    ),
    green: clampColorChannel(
      foreground.green * normalizedAlpha + background.green * inverseAlpha,
    ),
    blue: clampColorChannel(
      foreground.blue * normalizedAlpha + background.blue * inverseAlpha,
    ),
  }
}

function expandShortHex(hex: string): string {
  if (hex.length === 3 || hex.length === 4) {
    return [...hex].map((character) => `${character}${character}`).join('')
  }

  return hex
}

function toHexChannel(value: number): string {
  return clampColorChannel(value).toString(16).padStart(2, '0')
}

function linearizeColorChannel(value: number): number {
  const normalizedValue = clampColorChannel(value) / 255

  if (normalizedValue <= 0.04045) {
    return normalizedValue / 12.92
  }

  return ((normalizedValue + 0.055) / 1.055) ** 2.4
}

function formatAlpha(value: number): string {
  const percentage = clampAlpha(value) * 100
  const roundedPercentage = Math.round(percentage * 100) / 100

  return `${roundedPercentage}%`
}
