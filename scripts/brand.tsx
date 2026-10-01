/**
 * npm run logos (second step) — draw the favicon, the home-screen icon and the
 * link preview as PNGs into app/, where Next serves them as static files with
 * the right <meta> tags. They're drawn here, once, instead of on every request:
 * no fonts read at runtime, no rendering cost, and the same files work on any
 * host, Cloudflare Workers included. Commit the output.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import React from "react";
import themeJson from "@/content/generated/theme.json";
import type { Theme } from "@/lib/color";
import { initials, logoFor } from "@/lib/logos";
import { loadPublic } from "./lib/audit";

void React; // the scripts compile JSX with the classic runtime

const ROOT = process.cwd();
const { audit } = loadPublic();
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const researchedLabel = (() => {
  const [y, m] = audit.config.researched.split("-").map(Number);
  return `Researched ${MONTHS[m - 1]} ${y}`;
})();
const theme = themeJson as Theme;
const INK = "#1b1a17";
const PAGE = "#f8f7f4";

async function logoDataUrl(large: boolean): Promise<string | null> {
  const e = logoFor(audit.config.company.iconDomain ?? audit.config.company.domain);
  const src = large ? (e.src180 ?? e.src) : e.src;
  if (e.status !== "icon" || !src) return null;
  return `data:image/png;base64,${(await readFile(path.join(ROOT, "public", src))).toString("base64")}`;
}

async function brandFonts() {
  const nm = (...p: string[]) => readFile(path.join(ROOT, "node_modules", ...p));
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

// ── The favicon: the company's icon inside my frame, so the tab is recognisable
//    but never looks like their own site.
const size64 = { width: 64, height: 64 };
async function icon() {
  const logo = await logoDataUrl(false);
  return new ImageResponse(
    (
      <div style={{ width: 64, height: 64, display: "flex", alignItems: "flex-end", justifyContent: "flex-start", padding: 3 }}>
        <MarkTile size={54} logo={logo} dotRing="#ffffff" />
      </div>
    ),
    { ...size64, fonts: await brandFonts() },
  );
}

// ── Home-screen icon: full-bleed (iOS fills transparency with black), same mark.
const size180 = { width: 180, height: 180 };
async function appleIcon() {
  const logo = await logoDataUrl(true);
  const inner = 104;
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: INK, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {logo ? (
           
          <img src={logo} width={inner} height={inner} style={{ borderRadius: 24, background: "#ffffff" }} alt="" />
        ) : (
          <div
            style={{
              width: inner,
              height: inner,
              borderRadius: 26,
              background: theme.light.live,
              color: theme.light.liveContrast,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontFamily: "Geist Mono",
            }}
          >
            {initials(audit.config.company.name)}
          </div>
        )}
        <div style={{ position: "absolute", top: 22, right: 22, width: 26, height: 26, borderRadius: 26, background: theme.light.live }} />
      </div>
    ),
    { ...size180, fonts: await brandFonts() },
  );
}

// ── The link preview: the mark, the company, the role, "an outside-in read".
const size = { width: 1200, height: 630 };
async function opengraphImage() {
  const { company, role, author } = audit.config;
  const logo = await logoDataUrl(true);
  const live = theme.light.live;
  const nameSize = company.name.length > 22 ? 84 : company.name.length > 14 ? 100 : 118;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: `radial-gradient(900px 520px at 88% 30%, ${live}33, ${PAGE} 70%)`,
          fontFamily: "Geist",
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <MarkTile size={68} logo={logo} dotRing={PAGE} />
          <div style={{ display: "flex", fontFamily: "Geist Mono", fontSize: 22, letterSpacing: 4, color: "#68655d" }}>
            AN OUTSIDE-IN READ
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Instrument Serif", fontSize: nameSize, lineHeight: 1, letterSpacing: -1.5 }}>{company.name}</div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 36, color: "#4a4842" }}>
            For the {role.title} role
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 22, color: "#68655d" }}>
          <div style={{ display: "flex" }}>
            by {author.name} · {researchedLabel}
          </div>
          {company.fictional && (
            <div style={{ display: "flex", border: "2px dashed #9a968c", borderRadius: 8, padding: "4px 12px", fontFamily: "Geist Mono", fontSize: 18, letterSpacing: 2 }}>
              FICTIONAL EXAMPLE
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts: await brandFonts() },
  );
}

async function main() {
  const out: [string, () => Promise<ImageResponse>][] = [
    ["icon.png", icon],
    ["apple-icon.png", appleIcon],
    ["opengraph-image.png", opengraphImage],
  ];
  for (const [file, draw] of out) {
    const png = Buffer.from(await (await draw()).arrayBuffer());
    await writeFile(path.join(ROOT, "app", file), png);
    console.log(`  ✓ app/${file} (${(png.length / 1024).toFixed(0)} KB)`);
  }
  await writeFile(path.join(ROOT, "app", "opengraph-image.alt.txt"), `${audit.config.company.name}, an outside-in read`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
