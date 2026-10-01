import localFont from "next/font/local";

/**
 * Fonts ship from npm packages through next/font/local, never next/font/google,
 * so a production build never depends on a network fetch. Going through
 * next/font (rather than importing the packages' CSS) gets the display faces
 * preloaded with size-matched fallbacks: the headline paints at once and
 * doesn't jump when the real face arrives.
 *
 * Latin subsets only (Fontsource): a third of the full files. Glyphs outside
 * the subset (→, ⌘) fall back, per glyph, to the system face.
 *
 * Roles: serif display (Instrument Serif) and sans prose (Geist), both
 * preloaded; mono labels and numbers (Geist Mono) swap in, since they're never
 * the largest thing on screen.
 */
export const sans = localFont({
  src: "../node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const mono = localFont({
  src: "../node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const serif = localFont({
  src: [
    { path: "../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["ui-serif", "Georgia", "serif"],
});
