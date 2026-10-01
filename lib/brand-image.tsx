import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import themeJson from "@/content/generated/theme.json";
import type { Theme } from "@/lib/color";
import { audit } from "@/lib/content";
import { initials, logoFor } from "@/lib/logos";

/**
 * Shared pieces for the generated images (favicon, apple icon, link preview).
 * Everything is read from disk: the cached logo, the npm fonts. Nothing is
 * fetched, so the images build offline like the rest of the site.
 */

export const theme = themeJson as Theme;
export const INK = "#1b1a17";
export const PAGE = "#f8f7f4";

const root = process.cwd();

export async function logoDataUrl(large: boolean): Promise<string | null> {
  const e = logoFor(audit.config.company.domain);
  const src = large ? (e.src180 ?? e.src) : e.src;
  if (e.status !== "icon" || !src) return null;
  try {
    const buf = await readFile(path.join(root, "public", src));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function brandFonts() {
  const nm = (...p: string[]) => readFile(path.join(root, "node_modules", ...p));
  const [serif, regular, semibold, mono] = await Promise.all([
    nm("@fontsource", "instrument-serif", "files", "instrument-serif-latin-400-normal.woff"),
    nm("geist", "dist", "fonts", "geist-sans", "Geist-Regular.ttf"),
    nm("geist", "dist", "fonts", "geist-sans", "Geist-SemiBold.ttf"),
    nm("geist", "dist", "fonts", "geist-mono", "GeistMono-Regular.ttf"),
  ]);
  return [
    { name: "Instrument Serif", data: serif, weight: 400 as const, style: "normal" as const },
    { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Geist", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Geist Mono", data: mono, weight: 400 as const, style: "normal" as const },
  ];
}

/**
 * The mark, for satori: the company's icon (or a monogram) inside my dark
 * rounded tile, with a small accent dot at the corner.
 */
export function MarkTile({ size, logo, dotRing }: { size: number; logo: string | null; dotRing: string }) {
  const inner = Math.round(size * 0.62);
  const dot = Math.round(size * 0.28);
  const name = audit.config.company.name;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex" }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
          background: INK,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {logo ? (
           
          <img src={logo} width={inner} height={inner} style={{ borderRadius: Math.round(inner * 0.22), background: "#ffffff" }} alt="" />
        ) : (
          <div
            style={{
              width: inner,
              height: inner,
              borderRadius: Math.round(inner * 0.24),
              background: theme.light.live,
              color: theme.light.liveContrast,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: Math.round(inner * 0.46),
              fontFamily: "Geist Mono",
              letterSpacing: -1,
            }}
          >
            {initials(name)}
          </div>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          top: -Math.round(dot * 0.3),
          right: -Math.round(dot * 0.3),
          width: dot,
          height: dot,
          borderRadius: dot,
          background: theme.light.live,
          border: `${Math.max(2, Math.round(dot * 0.18))}px solid ${dotRing}`,
        }}
      />
    </div>
  );
}
