/**
 * Small colour utilities: hex ⇄ OKLCH, WCAG contrast, and the accent derivation
 * used by `npm run logos`. Pure functions, no dependencies.
 */

export type RGB = [number, number, number]; // 0–1
export type OKLCH = { l: number; c: number; h: number };

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as RGB;
}

export function rgbToHex([r, g, b]: RGB): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function rgbToOklch(rgb: RGB): OKLCH {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.sqrt(A * A + B * B);
  const h = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h };
}

/** OKLCH → linear-free sRGB, unclamped (may be out of gamut). */
function oklchToRgbRaw({ l: L, c, h }: OKLCH): RGB {
  const A = c * Math.cos((h * Math.PI) / 180);
  const B = c * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

const inGamut = (rgb: RGB) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);

/** OKLCH → sRGB hex, reducing chroma until the colour fits in gamut. */
export function oklchToHex(color: OKLCH): string {
  let c = color.c;
  let rgb = oklchToRgbRaw({ ...color, c });
  while (!inGamut(rgb) && c > 0) {
    c = Math.max(0, c - 0.004);
    rgb = oklchToRgbRaw({ ...color, c });
  }
  return rgbToHex(rgb);
}

export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Move a colour's lightness (holding hue and chroma) until it reaches `min` contrast on every background. */
export function fitContrast(hex: string, backgrounds: string[], min: number, direction: "darker" | "lighter"): string {
  const base = rgbToOklch(hexToRgb(hex));
  let l = base.l;
  for (let i = 0; i < 120; i++) {
    const out = oklchToHex({ ...base, l });
    if (backgrounds.every((bg) => contrast(out, bg) >= min)) return out;
    l = direction === "darker" ? l - 0.01 : l + 0.01;
    if (l <= 0.05 || l >= 0.98) break;
  }
  return oklchToHex({ ...base, l: Math.min(0.98, Math.max(0.05, l)) });
}

/**
 * Hues that hold up as an accent in both modes. When a company's icon is
 * greyscale (or missing), the accent is one of these, picked by domain, so
 * each audit still gets a stable identity without landing on mud.
 */
export const CURATED_HUES = [264, 285, 240, 200, 168, 28, 350, 318] as const;

/** A stable curated hue from a string, for audits whose company icon has no colour. */
export function hueFrom(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return CURATED_HUES[Math.abs(h) % CURATED_HUES.length];
}

export const SURFACES = {
  light: { page: "#f8f7f4", surface: "#ffffff", inset: "#f2f1ec" },
  dark: { page: "#111110", surface: "#181816", inset: "#0d0d0c" },
} as const;

export interface AccentTokens {
  /** Marks, fills, focus rings: ≥ 3:1 on the page. */
  live: string;
  /** Accent-coloured text: ≥ 4.5:1 on every surface. */
  liveInk: string;
  /** Text on a solid --live fill. */
  liveContrast: string;
}

export interface Theme {
  source: "override" | "icon" | "domain";
  base: string;
  light: AccentTokens;
  dark: AccentTokens;
}

/**
 * Turn one base colour into accent tokens for both modes. The hue is the
 * company's; chroma is lifted to a floor so the accent never reads as grey;
 * lightness is moved per mode until contrast passes.
 */
export function deriveTheme(baseHex: string, source: Theme["source"]): Theme {
  const o = rgbToOklch(hexToRgb(baseHex));
  const c = Math.max(o.c, 0.13);
  const hue = o.h;

  const lightSeed = oklchToHex({ l: Math.min(o.l, 0.58), c, h: hue });
  const darkSeed = oklchToHex({ l: Math.max(o.l, 0.7), c: Math.min(c, 0.17), h: hue });

  const lightBgs = Object.values(SURFACES.light);
  const darkBgs = Object.values(SURFACES.dark);

  const light = {
    live: fitContrast(lightSeed, lightBgs, 3.2, "darker"),
    liveInk: fitContrast(lightSeed, lightBgs, 4.8, "darker"),
  };
  const dark = {
    live: fitContrast(darkSeed, darkBgs, 3.2, "lighter"),
    liveInk: fitContrast(darkSeed, darkBgs, 6, "lighter"),
  };
  const onFill = (fill: string) => (contrast("#ffffff", fill) >= 4.5 ? "#ffffff" : "#0b0b0a");

  return {
    source,
    base: baseHex,
    light: { ...light, liveContrast: onFill(light.live) },
    dark: { ...dark, liveContrast: onFill(dark.live) },
  };
}

/** The inline <style> that installs a theme's accent tokens in both modes. */
export function themeCss(t: Theme) {
  const vars = (a: AccentTokens) => `--live:${a.live};--live-ink:${a.liveInk};--live-contrast:${a.liveContrast};`;
  return (
    `:root{${vars(t.light)}}` +
    `:root[data-theme="dark"]{${vars(t.dark)}}` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme]){${vars(t.dark)}}}` +
    `@media print{:root,:root[data-theme="dark"]{${vars(t.light)}}}`
  );
}
