interface ColorComponents {
  r: number;
  g: number;
  b: number;
}

interface OKLCHColor {
  l: number;
  c: number;
  h: number;
}

function hexToRgb(hex: string): ColorComponents {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

function srgbToLinear(val: number): number {
  return val > 0.04045 ? Math.pow((val + 0.055) / 1.055, 2.4) : val / 12.92;
}

function rgbToOklab(
  r: number,
  g: number,
  b: number
): { l: number; a: number; b: number } {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    l: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

function oklabToOklch(l: number, a: number, b: number): OKLCHColor {
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l, c, h };
}

export function hexToOklch(hex: string): string {
  try {
    const { r, g, b } = hexToRgb(hex);
    const { l, a, b: bComponent } = rgbToOklab(r, g, b);
    const { l: lightness, c: chroma, h: hue } = oklabToOklch(l, a, bComponent);

    if (chroma < 0.0001) {
      return `oklch(${Math.round(lightness * 1000) / 1000} 0 0)`;
    }

    return `oklch(${Math.round(lightness * 1000) / 1000} ${
      Math.round(chroma * 1000) / 1000
    } ${Math.round(hue * 1000) / 1000})`;
  } catch (error) {
    console.warn(
      `Failed to convert ${hex} to OKLCH, falling back to hex`,
      error
    );
    return hex;
  }
}
