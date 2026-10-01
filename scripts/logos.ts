/**
 * npm run logos
 *
 * 1. Collects every domain in content/: the company, each competitor, and the
 *    domain of every source.
 * 2. Fetches each one's icon from Twenty's favicon service
 *    (https://twenty-icons.com/{domain}/{size}) into public/logos/, so the
 *    site never hotlinks at runtime: it works with the network off and loads
 *    instantly in an interview.
 * 3. Anything that 404s, fails to decode, or sits on a reserved TLD
 *    (.example, .test) falls back to a monogram tile drawn by <CompanyLogo>.
 * 4. Derives the accent from the company's icon (node-vibrant), lifts it to
 *    pass contrast in light and dark, and writes content/generated/theme.json.
 *    `accent` in audit.config.ts overrides it.
 *
 * Output is committed. The build never fetches anything.
 *
 *   npm run logos            fetch what's missing, keep what's cached
 *   npm run logos -- --force refetch everything
 */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { Vibrant } from "node-vibrant/node";
import rawConfig from "@/content/audit.config";
import competitors from "@/content/competitors";
import sources from "@/content/sources";
import { contrast, deriveTheme, hueFrom, oklchToHex, rgbToOklch, hexToRgb, type Theme } from "@/lib/color";
import type { LogoEntry, LogoManifest } from "@/lib/logos";
import { ConfigSchema } from "@/lib/schema/public";

const config = ConfigSchema.parse(rawConfig);

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "logos");
const GEN_DIR = path.join(ROOT, "content", "generated");
const MANIFEST = path.join(GEN_DIR, "logos.json");
const THEME = path.join(GEN_DIR, "theme.json");
const SERVICE = "https://twenty-icons.com";
const RESERVED = /\.(example|test|invalid|localhost)$/i;
const FORCE = process.argv.includes("--force");

const normalise = (d: string) => d.trim().toLowerCase().replace(/^www\./, "");
const fileFor = (domain: string, size: number) => `${domain.replace(/[^a-z0-9.-]/g, "_")}${size === 64 ? "" : `@${size}`}.png`;

function collectDomains() {
  const out = new Map<string, string>(); // domain → why
  out.set(normalise(config.company.domain), "company");
  for (const c of competitors.field) if (!out.has(normalise(c.domain))) out.set(normalise(c.domain), `competitor: ${c.name}`);
  for (const s of sources.items) {
    const d = normalise(new URL(s.url).hostname);
    if (!out.has(d)) out.set(d, `source: ${s.id}`);
  }
  return out;
}

async function exists(p: string) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function fetchIcon(domain: string, size: number): Promise<{ buf: Buffer; width: number } | { error: string }> {
  try {
    const res = await fetch(`${SERVICE}/${domain}/${size}`, { signal: AbortSignal.timeout(15000) });
    if (res.status === 404) return { error: "no icon (404)" };
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return { error: `not an image (${type})` };
    const raw = Buffer.from(await res.arrayBuffer());
    // Normalise to PNG, and prove it decodes.
    const img = sharp(raw);
    const meta = await img.metadata();
    if (!meta.width || meta.width < 8) return { error: "undecodable or too small" };
    const buf = await img.png().toBuffer();
    return { buf, width: meta.width };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

async function loadManifest(): Promise<LogoManifest> {
  try {
    return JSON.parse(await readFile(MANIFEST, "utf8"));
  } catch {
    return { generatedAt: "", entries: {} };
  }
}

async function pickAccentFromIcon(file: string): Promise<string | null> {
  const palette = await Vibrant.from(file).getPalette();
  const swatches = Object.entries(palette).filter(([, s]) => s) as [string, NonNullable<(typeof palette)[string]>][];
  let best: { hex: string; score: number } | null = null;
  for (const [name, s] of swatches) {
    const o = rgbToOklch(hexToRgb(s.hex));
    if (o.c < 0.06 || o.l < 0.22 || o.l > 0.93) continue; // greys, near-black, near-white
    const preference = name === "Vibrant" ? 1.3 : name === "DarkVibrant" ? 1.1 : name.includes("Vibrant") ? 1 : 0.7;
    const score = o.c * preference * Math.log(2 + s.population);
    if (!best || score > best.score) best = { hex: s.hex, score };
  }
  return best?.hex ?? null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(GEN_DIR, { recursive: true });

  const domains = collectDomains();
  const previous = await loadManifest();
  const entries: Record<string, LogoEntry> = {};
  const rows: string[][] = [];

  for (const [domain, why] of domains) {
    const prev = previous.entries[domain];
    const small = path.join(OUT_DIR, fileFor(domain, 64));
    const large = path.join(OUT_DIR, fileFor(domain, 180));

    if (RESERVED.test(domain)) {
      entries[domain] = { status: "monogram", reason: "reserved TLD (fictional)" };
      rows.push([domain, "monogram", "reserved TLD", why]);
      continue;
    }
    if (!FORCE && prev?.status === "icon" && (await exists(small)) && (await exists(large))) {
      entries[domain] = prev;
      rows.push([domain, "icon", "cached", why]);
      continue;
    }

    const [a, b] = await Promise.all([fetchIcon(domain, 64), fetchIcon(domain, 180)]);
    if ("buf" in a && "buf" in b) {
      await writeFile(small, a.buf);
      await writeFile(large, b.buf);
      entries[domain] = {
        status: "icon",
        src: `/logos/${fileFor(domain, 64)}`,
        src180: `/logos/${fileFor(domain, 180)}`,
        size: b.width,
        fetchedAt: new Date().toISOString().slice(0, 10),
      };
      rows.push([domain, "icon", b.width < 64 ? `fetched (low-res ${b.width}px)` : "fetched", why]);
    } else if (prev?.status === "icon" && (await exists(small))) {
      // The service is down or flaky: keep what we had rather than downgrading.
      entries[domain] = prev;
      rows.push([domain, "icon", `kept cached (${"error" in a ? a.error : "error" in b ? b.error : ""})`, why]);
    } else {
      const reason = "error" in a ? a.error : "error" in b ? b.error : "unknown";
      entries[domain] = { status: "monogram", reason };
      rows.push([domain, "monogram", reason, why]);
    }
  }

  const manifest: LogoManifest = { generatedAt: new Date().toISOString().slice(0, 10), entries };
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

  // ── Accent ────────────────────────────────────────────────────────────────
  const companyDomain = normalise(config.company.domain);
  const company = entries[companyDomain];
  let theme: Theme;
  if (config.accent) {
    theme = deriveTheme(config.accent, "override");
  } else {
    const fromIcon = company?.status === "icon" && company.src180 ? await pickAccentFromIcon(path.join(ROOT, "public", company.src180)) : null;
    theme = fromIcon
      ? deriveTheme(fromIcon, "icon")
      : deriveTheme(oklchToHex({ l: 0.55, c: 0.16, h: hueFrom(companyDomain) }), "domain");
  }
  await writeFile(THEME, JSON.stringify(theme, null, 2) + "\n");

  // ── Report ────────────────────────────────────────────────────────────────
  const widths = [0, 1, 2, 3].map((i) => Math.max(...rows.map((r) => r[i].length), 6));
  console.log(`\nLogos (${rows.length} domains → public/logos, content/generated/logos.json)\n`);
  for (const r of rows) console.log("  " + r.map((c, i) => c.padEnd(widths[i])).join("  "));
  const icons = rows.filter((r) => r[1] === "icon").length;
  console.log(`\n  ${icons} icons, ${rows.length - icons} monograms`);
  const fmt = (m: Theme["light"], bg: string) =>
    `live ${m.live} (${contrast(m.live, bg).toFixed(1)}:1) · ink ${m.liveInk} (${contrast(m.liveInk, bg).toFixed(1)}:1)`;
  console.log(`\nAccent from ${theme.source}: ${theme.base}`);
  console.log(`  light  ${fmt(theme.light, "#f8f7f4")}`);
  console.log(`  dark   ${fmt(theme.dark, "#111110")}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
