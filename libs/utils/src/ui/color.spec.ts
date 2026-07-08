// libs/utils/src/ui/color.spec.ts

import { describe, expect, it } from 'vitest';

import {
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
  rgbToHex,
  rgbaToHex,
  toCssColorWithAlpha,
  toCssRgb,
  toCssRgba,
} from './color';

describe('clampColorChannel', () => {
  it('clamps values below zero to zero', () => {
    expect(clampColorChannel(-24)).toBe(0);
  });

  it('clamps values above 255 to 255', () => {
    expect(clampColorChannel(280)).toBe(255);
  });

  it('rounds valid decimal values to the nearest channel value', () => {
    expect(clampColorChannel(127.6)).toBe(128);
  });

  it('keeps valid integer channel values unchanged', () => {
    expect(clampColorChannel(246)).toBe(246);
  });
});

describe('clampAlpha', () => {
  it('clamps values below zero to zero', () => {
    expect(clampAlpha(-0.25)).toBe(0);
  });

  it('clamps values above one to one', () => {
    expect(clampAlpha(1.5)).toBe(1);
  });

  it('keeps valid alpha values unchanged', () => {
    expect(clampAlpha(0.42)).toBe(0.42);
  });
});

describe('isHexColor', () => {
  it.each(['#fff', '#ffff', '#F6066F', '#f6066f', '#00DBC9FF', '#8c52ff80'])(
    'returns true for a valid hex color: %s',
    (value) => {
      expect(isHexColor(value)).toBe(true);
    },
  );

  it.each([
    '',
    'fff',
    '#ff',
    '#fffff',
    '#gggggg',
    'rgb(0 219 201)',
    'var(--ae-pink)',
  ])('returns false for an invalid hex color: %s', (value) => {
    expect(isHexColor(value)).toBe(false);
  });
});

describe('hexToRgba', () => {
  it('converts a six-character hex color into RGBA channels', () => {
    expect(hexToRgba('#F6066F')).toEqual({
      red: 246,
      green: 6,
      blue: 111,
      alpha: 1,
    });
  });

  it('converts a three-character shorthand hex color into RGBA channels', () => {
    expect(hexToRgba('#0dc')).toEqual({
      red: 0,
      green: 221,
      blue: 204,
      alpha: 1,
    });
  });

  it('converts an eight-character hex color with alpha into RGBA channels', () => {
    expect(hexToRgba('#8C52FF80')).toEqual({
      red: 140,
      green: 82,
      blue: 255,
      alpha: 128 / 255,
    });
  });

  it('converts a four-character shorthand hex color with alpha into RGBA channels', () => {
    expect(hexToRgba('#f06c')).toEqual({
      red: 255,
      green: 0,
      blue: 102,
      alpha: 204 / 255,
    });
  });

  it('trims surrounding whitespace', () => {
    expect(hexToRgba('  #00DBC9  ')).toEqual({
      red: 0,
      green: 219,
      blue: 201,
      alpha: 1,
    });
  });

  it('returns undefined for an unsupported color', () => {
    expect(hexToRgba('not-a-color')).toBeUndefined();
  });
});

describe('hexToRgb', () => {
  it('converts a hex color into RGB channels without alpha', () => {
    expect(hexToRgb('#00DBC9')).toEqual({
      red: 0,
      green: 219,
      blue: 201,
    });
  });

  it('ignores alpha when converting an eight-character hex color', () => {
    expect(hexToRgb('#8C52FF80')).toEqual({
      red: 140,
      green: 82,
      blue: 255,
    });
  });

  it('returns undefined for an unsupported color', () => {
    expect(hexToRgb('#invalid')).toBeUndefined();
  });
});

describe('rgbToHex', () => {
  it('converts RGB channels into a lowercase hexadecimal color', () => {
    expect(
      rgbToHex({
        red: 246,
        green: 6,
        blue: 111,
      }),
    ).toBe('#f6066f');
  });

  it('clamps and rounds invalid RGB channels before conversion', () => {
    expect(
      rgbToHex({
        red: -20,
        green: 127.6,
        blue: 300,
      }),
    ).toBe('#0080ff');
  });
});

describe('rgbaToHex', () => {
  it('converts RGBA channels into an eight-character hexadecimal color', () => {
    expect(
      rgbaToHex({
        red: 246,
        green: 6,
        blue: 111,
        alpha: 0.5,
      }),
    ).toBe('#f6066f80');
  });

  it('clamps alpha before conversion', () => {
    expect(
      rgbaToHex({
        red: 0,
        green: 219,
        blue: 201,
        alpha: 1.5,
      }),
    ).toBe('#00dbc9ff');
  });
});

describe('CSS color formatting', () => {
  it('formats an RGB color as a CSS rgb() value', () => {
    expect(
      toCssRgb({
        red: 0,
        green: 219,
        blue: 201,
      }),
    ).toBe('rgb(0 219 201)');
  });

  it('formats a color with alpha as a CSS rgb() value', () => {
    expect(
      toCssColorWithAlpha(
        {
          red: 0,
          green: 219,
          blue: 201,
        },
        0.2,
      ),
    ).toBe('rgb(0 219 201 / 20%)');
  });

  it('formats an RGBA color as a CSS rgb() value', () => {
    expect(
      toCssRgba({
        red: 140,
        green: 82,
        blue: 255,
        alpha: 0.25,
      }),
    ).toBe('rgb(140 82 255 / 25%)');
  });

  it('clamps CSS color values before formatting', () => {
    expect(
      toCssColorWithAlpha(
        {
          red: -10,
          green: 128.4,
          blue: 280,
        },
        2,
      ),
    ).toBe('rgb(0 128 255 / 100%)');
  });
});

describe('getRelativeLuminance', () => {
  it('returns zero for black', () => {
    expect(
      getRelativeLuminance({
        red: 0,
        green: 0,
        blue: 0,
      }),
    ).toBe(0);
  });

  it('returns one for white', () => {
    expect(
      getRelativeLuminance({
        red: 255,
        green: 255,
        blue: 255,
      }),
    ).toBe(1);
  });

  it('returns a luminance value between zero and one for a brand color', () => {
    const luminance = getRelativeLuminance({
      red: 0,
      green: 219,
      blue: 201,
    });

    expect(luminance).toBeGreaterThan(0);
    expect(luminance).toBeLessThan(1);
  });
});

describe('getContrastRatio', () => {
  const black = {
    red: 0,
    green: 0,
    blue: 0,
  };

  const white = {
    red: 255,
    green: 255,
    blue: 255,
  };

  const deepNight = {
    red: 5,
    green: 10,
    blue: 30,
  };

  const starlight = {
    red: 247,
    green: 244,
    blue: 255,
  };

  it('returns the maximum contrast ratio for black and white', () => {
    expect(getContrastRatio(black, white)).toBeCloseTo(21, 8);
  });

  it('returns the same ratio regardless of color order', () => {
    expect(getContrastRatio(deepNight, starlight)).toBeCloseTo(
      getContrastRatio(starlight, deepNight),
      8,
    );
  });

  it('returns a ratio greater than WCAG AA for Aerealith starlight on Deep Night', () => {
    expect(getContrastRatio(starlight, deepNight)).toBeGreaterThan(4.5);
  });
});

describe('hasContrastRatio', () => {
  const black = {
    red: 0,
    green: 0,
    blue: 0,
  };

  const white = {
    red: 255,
    green: 255,
    blue: 255,
  };

  it('returns true when colors meet the requested ratio', () => {
    expect(hasContrastRatio(white, black, 7)).toBe(true);
  });

  it('returns false when colors do not meet the requested ratio', () => {
    expect(
      hasContrastRatio(
        {
          red: 174,
          green: 183,
          blue: 200,
        },
        {
          red: 247,
          green: 244,
          blue: 255,
        },
        4.5,
      ),
    ).toBe(false);
  });
});

describe('getReadableForeground', () => {
  it('recommends white for a dark background', () => {
    expect(
      getReadableForeground({
        red: 5,
        green: 10,
        blue: 30,
      }),
    ).toBe('white');
  });

  it('recommends black for a light background', () => {
    expect(
      getReadableForeground({
        red: 247,
        green: 244,
        blue: 255,
      }),
    ).toBe('black');
  });
});

describe('blendColors', () => {
  const foreground = {
    red: 0,
    green: 219,
    blue: 201,
  };

  const background = {
    red: 5,
    green: 10,
    blue: 30,
  };

  it('returns the background when alpha is zero', () => {
    expect(blendColors(foreground, background, 0)).toEqual(background);
  });

  it('returns the foreground when alpha is one', () => {
    expect(blendColors(foreground, background, 1)).toEqual(foreground);
  });

  it('blends the foreground and background channels at partial opacity', () => {
    expect(blendColors(foreground, background, 0.5)).toEqual({
      red: 3,
      green: 115,
      blue: 116,
    });
  });

  it('clamps invalid alpha values before blending', () => {
    expect(blendColors(foreground, background, -1)).toEqual(background);
    expect(blendColors(foreground, background, 2)).toEqual(foreground);
  });
});
