/**
 * npm run verify:share — prove the share view leaks nothing.
 *
 * Must pass before any link is sent. CI runs it on every push.
 *
 * 1. Builds the site (skip with --no-build when a fresh build already exists).
 * 2. Starts it with a throwaway PREP_KEY and the PREP_SECRET that opens the
 *    sealed prep. With no secret (CI without the repo secret), it seals your
 *    content/prep.ts, or failing that the template's example, with a
 *    throwaway secret for the run and puts the sealed file back afterwards.
 * 3. Derives probes from every string in the prep, minus anything that also
 *    appears in public content.
 * 4. Crawls every route in the share view (no cookie, and the ?share preview
 *    with the cookie) and checks, after normalising:
 *      - the raw server HTML (React's <!-- --> separators stripped, entities
 *        decoded: "{fit} fit" serialises as "Low<!-- --> fit", and a naive
 *        search reports a false pass),
 *      - the RSC payload a client-side navigation would fetch,
 *      - the rendered DOM in a real browser, with the ⌘K palette open,
 *      - every JS and CSS chunk the build ships.
 * 5. Asserts the gate: /prep is 404 without the key, with a wrong key, in the
 *    share preview and after ?prep=off; 200 with the key.
 * 6. Control: the same probes must be found in the prep view. If they aren't,
 *    the probes are dead and the test fails rather than passing silently.
 * 7. Git hygiene: fails if content/prep.ts is tracked (repos are public; only
 *    the sealed file belongs in git), warns if it's in the history.
 *
 * Flags: --no-build, --verbose.
 */
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { isSealed, newSecret, seal, unseal } from "@/lib/prep/seal";
import { parsePrep } from "@/lib/schema/prep";
import type { PublicAudit } from "@/lib/schema/public";
import { loadPrepPlain, loadPublic, PREP_SEALED, readSealed } from "./lib/audit";
import { envVar } from "./lib/env";
import { contentFingerprint } from "./lib/fingerprint";
import { exampleLeftovers } from "./lib/leftovers";

const ROOT = process.cwd();
const ARGS = new Set(process.argv.slice(2));
const VERBOSE = ARGS.has("--verbose");
const KEY = `verify-${randomBytes(12).toString("hex")}`;

const failures: string[] = [];
const warnings: string[] = [];
const fail = (m: string) => failures.push(m);
const log = (m: string) => console.log(m);

// ── Normalisation ────────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#x27": "'", "#39": "'", "#x2F": "/" };

/** Make server HTML, RSC payloads, JS chunks and source strings comparable. */
function normalise(s: string) {
  return s
    .replace(/<!--\s*-->/g, "") // React text separators
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) // JSON / JS escapes
    .replace(/\\(["'\\/])/g, "$1")
    .replace(/\\[nrt]/g, " ")
    .replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (m, e: string) => {
      if (ENTITIES[e]) return ENTITIES[e];
      if (e.startsWith("#x")) return String.fromCodePoint(parseInt(e.slice(2), 16));
      if (e.startsWith("#")) return String.fromCodePoint(parseInt(e.slice(1), 10));
      return m;
    })
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function* strings(node: unknown): Generator<string> {
  if (typeof node === "string") yield node;
  else if (Array.isArray(node)) for (const n of node) yield* strings(n);
  else if (node && typeof node === "object") for (const v of Object.values(node)) yield* strings(v);
}

// ── Probes ───────────────────────────────────────────────────────────────────

interface Probe {
  text: string;
  from: string;
}

/**
 * Words that ship to everyone anyway: the template's own copy in public pages
 * and components. A talk-track note that quotes the page aloud isn't a leak.
 */
function publicSourceCorpus(): string {
  const isPrep = (f: string) => /(^|\/)(prep)(\/|\.ts)|schema\/prep\.ts$/.test(path.relative(ROOT, f));
  const files = ["app", "components", "lib"].flatMap((d) => walkFiles(path.join(ROOT, d), /\.(tsx?|css)$/)).filter((f) => !isPrep(f));
  return normalise(files.map((f) => readFileSync(f, "utf8")).join(" | "));
}

function buildProbes(prep: unknown, contentCorpus: string, sourceCorpus: string) {
  const probes: Probe[] = [];
  const seen = new Set<string>();
  let shared = 0;
  const quoted: Probe[] = [];
  for (const raw of strings(prep)) {
    const s = normalise(raw).trim();
    if (s.length < 24) continue; // too short to be distinctive
    const words = s.split(" ");
    const windows =
      words.length <= 8
        ? [s]
        : [words.slice(0, 8).join(" "), words.slice(Math.max(0, Math.floor(words.length / 2) - 4), Math.floor(words.length / 2) + 4).join(" ")];
    for (const w of windows) {
      if (w.length < 20 || seen.has(w)) continue;
      seen.add(w);
      const probe = { text: w, from: raw.length > 70 ? `${raw.slice(0, 67)}…` : raw };
      if (contentCorpus.includes(w)) {
        shared++; // the same words are public content (a name, a quoted figure)
        continue;
      }
      if (sourceCorpus.includes(w)) {
        quoted.push(probe); // the template's own public copy, quoted in prep: not a leak, but said out loud
        continue;
      }
      probes.push(probe);
    }
  }
  return { probes, shared, quoted };
}

// ── Server ───────────────────────────────────────────────────────────────────

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, () => {
      const port = (srv.address() as { port: number }).port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

async function startServer(port: number): Promise<ChildProcess> {
  const bin = path.join(ROOT, "node_modules", ".bin", "next");
  const child = spawn(bin, ["start", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: ROOT,
    env: { ...process.env, PREP_KEY: KEY, PREP_SECRET: SECRET, NODE_ENV: "production", PORT: String(port) },
    stdio: VERBOSE ? "inherit" : "ignore",
  });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/`, { redirect: "manual" });
      if (r.status > 0) return child;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  child.kill();
  throw new Error("The server didn't start within 60s. Run with --verbose to see its output.");
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

let BASE = "";
let SECRET = "";

async function get(p: string, opts: { cookie?: string; rsc?: boolean } = {}) {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers.cookie = opts.cookie;
  if (opts.rsc) headers.RSC = "1";
  const r = await fetch(BASE + p, { headers, redirect: "manual" });
  return { status: r.status, body: await r.text(), headers: r.headers };
}

async function prepCookie(): Promise<string> {
  const r = await fetch(`${BASE}/?prep=${encodeURIComponent(KEY)}`, { redirect: "manual" });
  const set = r.headers.get("set-cookie") ?? "";
  const m = set.match(/audit_prep=([^;]+)/);
  if (!m) throw new Error("Visiting ?prep=<key> didn't set the prep cookie. The gate is broken.");
  return `audit_prep=${m[1]}`;
}

function linksIn(html: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    let href = m[1].replace(/&amp;/g, "&");
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    href = href.split("#")[0];
    if (/^\/(_next|logos|icon|apple-icon|opengraph-image|favicon)/.test(href)) continue;
    out.add(href);
  }
  return [...out];
}

// ── Checks ───────────────────────────────────────────────────────────────────

interface Hit {
  where: string;
  route: string;
  probe: Probe;
}

function scan(haystack: string, probes: Probe[], where: string, route: string): Hit[] {
  const h = normalise(haystack);
  return probes.filter((p) => h.includes(p.text)).map((probe) => ({ where, route, probe }));
}

function walkFiles(dir: string, exts: RegExp, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walkFiles(p, exts, out);
    else if (exts.test(f)) out.push(p);
  }
  return out;
}

function git(args: string[]): string | null {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

async function domCheck(routes: string[], probes: Probe[], cookie: string | null, suffix: string): Promise<{ hits: Hit[]; found: Set<string>; skipped?: string }> {
  let chromium: typeof import("playwright-core").chromium;
  try {
    ({ chromium } = await import("playwright-core"));
  } catch {
    return { hits: [], found: new Set(), skipped: "playwright-core isn't installed" };
  }
  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    const fallback = ["/opt/pw-browsers/chromium", process.env.CHROMIUM_PATH].find((p) => p && existsSync(p));
    if (!fallback) return { hits: [], found: new Set(), skipped: "no Chromium found (run: npx playwright-core install chromium)" };
    browser = await chromium.launch({ executablePath: fallback });
  }
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  if (cookie) {
    const [name, value] = cookie.split("=");
    await ctx.addCookies([{ name, value, url: BASE }]);
  }
  const page = await ctx.newPage();
  const hits: Hit[] = [];
  const found = new Set<string>();
  for (const r of routes) {
    const url = BASE + r + (suffix ? (r.includes("?") ? "&" : "?") + suffix : "");
    const res = await page.goto(url, { waitUntil: "networkidle" }).catch(() => null);
    if (!res || res.status() >= 400) continue;
    await page.waitForTimeout(250);
    // Open the palette too: its items only exist in the DOM while it's open.
    await page.keyboard.press("Control+KeyK").catch(() => {});
    await page.waitForTimeout(250);
    const dom = await page.evaluate(() => document.documentElement.outerHTML + "\n" + document.body.innerText);
    for (const h of scan(dom, probes, "dom", r)) {
      hits.push(h);
      found.add(h.probe.text);
    }
    await page.keyboard.press("Escape").catch(() => {});
  }
  await browser.close();
  return { hits, found };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  log("verify:share — proving the share view leaks nothing\n");

  // Content, and the probes derived from it.
  let audit: PublicAudit;
  try {
    audit = loadPublic().audit;
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }

  // Fingerprint the content before anything below re-seals it for the run.
  const fingerprint = contentFingerprint();

  // The prep under test, and the secret the server will open it with.
  const original = existsSync(PREP_SEALED) ? readFileSync(PREP_SEALED, "utf8") : null;
  let secret = envVar("PREP_SECRET");
  let prepRaw: unknown = null;
  let prepFrom = "";
  const sealed = readSealed();
  if (secret && isSealed(sealed)) {
    try {
      prepRaw = JSON.parse(await unseal(sealed, secret));
      prepFrom = "content/prep.sealed.json";
    } catch {
      fail("content/prep.sealed.json doesn't open with this PREP_SECRET. Run `npm run prep:seal`.");
    }
    const plain = await loadPrepPlain();
    if (plain && prepRaw && JSON.stringify(parsePrep(plain.raw, audit)) !== JSON.stringify(parsePrep(prepRaw, audit)))
      warnings.push("content/prep.sealed.json is older than content/prep.ts, so a deploy would show stale prep. Run `npm run prep:seal`.");
  }
  if (!prepRaw) {
    // No secret here (CI without the repo secret): seal the plain prep for this run only.
    const plain = await loadPrepPlain({ allowExample: true });
    if (!plain) {
      console.error("No prep to test: no PREP_SECRET for content/prep.sealed.json and no content/prep.ts.");
      process.exit(1);
    }
    if (plain.file.endsWith("prep.example.ts") && !audit.config.company.fictional)
      warnings.push("No PREP_SECRET, so this run checked the boundary with the template's example prep, not yours. Add PREP_SECRET as a repo secret so CI checks your real notes.");
    prepRaw = plain.raw;
    prepFrom = path.relative(ROOT, plain.file);
    secret = newSecret();
    writeFileSync(PREP_SEALED, JSON.stringify(await seal(JSON.stringify(parsePrep(prepRaw, audit)), secret), null, 2) + "\n");
  }
  const restore = () => {
    if (original === null) return;
    if (readFileSync(PREP_SEALED, "utf8") !== original) writeFileSync(PREP_SEALED, original);
  };
  process.on("exit", restore);
  SECRET = secret!;

  const prep = parsePrep(prepRaw, audit);
  const { probes, shared, quoted } = buildProbes(prep, normalise([...strings(audit)].join(" | ")), publicSourceCorpus());
  log(`  ${probes.length} probes from ${prepFrom} (${shared + quoted.length} skipped because the same words are already public)`);
  for (const q of quoted)
    warnings.push(`The prep quotes text that's already in the public page code, so it isn't probed: “${q.text}” (from: ${q.from}). Fine if the talk track reads the page aloud; if not, that text shouldn't be in a public component.`);
  if (probes.length < 5) fail(`Only ${probes.length} probes: the prep is too thin to prove anything. Add real prep content.`);

  // 0. A real audit carries nothing of the template's fictional example.
  if (!audit.config.company.fictional) {
    const left = exampleLeftovers();
    for (const [file, hits] of Object.entries(left)) fail(`${file} still has the template's example in it (${hits.join(", ")}). Replace it before sending.`);
    if (!Object.keys(left).length) log("  ✓ nothing left of the template's example");
  }

  // 1. Git: repos are public, so only the sealed prep may ever be committed.
  if (git(["rev-parse", "--is-inside-work-tree"]) === "true") {
    if (git(["ls-files", "--error-unmatch", "content/prep.ts"]) !== null)
      fail("content/prep.ts is tracked by git, so your prep notes are in the repo for anyone to read. Run `git rm --cached content/prep.ts` (it's in .gitignore) and commit only content/prep.sealed.json.");
    else log("  ✓ content/prep.ts is not tracked by git");
    const history = git(["log", "--all", "--format=%h", "--", "content/prep.ts"]);
    if (history && !audit.config.company.fictional)
      warnings.push(`content/prep.ts is in this repo's git history (${history.split("\n").length} commits). Anyone can read those versions on a public repo; rewrite the history or start a fresh repo if they held real notes.`);
  }

  // 2. Build.
  if (!ARGS.has("--no-build")) {
    log("  building…");
    execFileSync(path.join(ROOT, "node_modules", ".bin", "next"), ["build"], { cwd: ROOT, stdio: VERBOSE ? "inherit" : "ignore", env: { ...process.env, NODE_ENV: "production" } });
  } else if (!existsSync(path.join(ROOT, ".next", "BUILD_ID"))) {
    console.error("--no-build was passed but there's no build in .next. Run `npm run build` first.");
    process.exit(1);
  }

  // 3. Static chunks: prep must never be in anything the browser downloads.
  const chunks = walkFiles(path.join(ROOT, ".next", "static"), /\.(js|css|json|txt)$/);
  let chunkHits = 0;
  for (const f of chunks) {
    for (const h of scan(readFileSync(f, "utf8"), probes, "static chunk", path.relative(ROOT, f))) {
      chunkHits++;
      fail(`LEAK in ${h.route}: “${h.probe.text}” (from: ${h.probe.from})`);
    }
  }
  log(`  ${chunkHits ? "✗" : "✓"} ${chunks.length} static chunks scanned`);

  // 4. Serve it.
  const port = await freePort();
  BASE = `http://127.0.0.1:${port}`;
  const server = await startServer(port);
  try {
    // Routes: everything the content defines, plus everything linked from the site.
    const on = audit.config.modules;
    const seeds = new Set<string>(["/", "/nope-404-check"]);
    for (const [m, enabled] of Object.entries(on)) if (enabled) seeds.add(`/${m}`);
    if (on.workflows) for (const w of audit.workflows) seeds.add(`/workflows/${w.id}`);
    const routes: string[] = [];
    const queue = [...seeds];
    const visited = new Set<string>();
    const shareHits: Hit[] = [];
    while (queue.length && visited.size < 250) {
      const r = queue.shift()!;
      if (visited.has(r)) continue;
      visited.add(r);
      const page = await get(r);
      if (page.status >= 300 && page.status < 400) continue;
      routes.push(r);
      shareHits.push(...scan(page.body, probes, "server HTML", r));
      const rsc = await get(r, { rsc: true });
      shareHits.push(...scan(rsc.body, probes, "RSC payload", r));
      for (const l of linksIn(page.body)) if (!visited.has(l) && !l.startsWith("/prep")) queue.push(l);
    }
    // The palette's index is fetched on demand: it must be as clean as the pages.
    {
      const idx = await get("/search-index");
      if (idx.status !== 200) fail(`/search-index returned ${idx.status}`);
      shareHits.push(...scan(idx.body, probes, "search index", "/search-index"));
    }
    // Also the prep URLs themselves, without the key.
    for (const r of ["/prep", "/prep/notes", "/prep/search-index"]) {
      const page = await get(r);
      shareHits.push(...scan(page.body, probes, "server HTML", r));
      if (page.status !== 404) fail(`${r} returned ${page.status} without the key; it must be 404`);
    }
    log(`  ${shareHits.length ? "✗" : "✓"} share view: ${routes.length} routes × server HTML + RSC payload`);

    // 5. The gate.
    const cookie = await prepCookie();
    const gate: [string, Promise<{ status: number }>, number][] = [
      ["/prep with the key", get("/prep", { cookie }), 200],
      ["/prep/notes with the key", get("/prep/notes", { cookie }), 200],
      ["/prep?share (share preview)", get("/prep?share", { cookie }), 404],
      ["/prep/notes?share (share preview)", get("/prep/notes?share", { cookie }), 404],
      ["/prep/search-index with the key", get("/prep/search-index", { cookie }), 200],
      ["/prep/search-index?share (share preview)", get("/prep/search-index?share", { cookie }), 404],
    ];
    for (const [label, p, want] of gate) {
      const { status } = await p;
      if (status !== want) fail(`${label} returned ${status}, expected ${want}`);
    }
    const wrong = await fetch(`${BASE}/?prep=not-the-key`, { headers: { cookie }, redirect: "manual" });
    const cleared = /audit_prep=;|audit_prep=(?:;|$)|Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(wrong.headers.get("set-cookie") ?? "");
    if (!cleared) fail("A wrong ?prep= key didn't clear the prep cookie");
    const off = await fetch(`${BASE}/?prep=off`, { headers: { cookie }, redirect: "manual" });
    if (!/Max-Age=0|Expires=Thu, 01 Jan 1970|audit_prep=;/i.test(off.headers.get("set-cookie") ?? "")) fail("?prep=off didn't clear the prep cookie");
    const forged = await get("/prep", { cookie: `audit_prep=${KEY}` });
    if (forged.status !== 404) fail("A cookie holding the raw key (not its digest) unlocked /prep");
    log(`  ${failures.some((f) => f.includes("returned") || f.includes("cookie")) ? "✗" : "✓"} gate: 404 without the key, with a forged cookie and in the share preview; 200 with the key; wrong key and ?prep=off clear the cookie`);

    // The share preview (key holder, ?share) must be exactly the public view.
    const previewHits: Hit[] = [];
    {
      const idx = await get("/search-index?share", { cookie });
      previewHits.push(...scan(idx.body, probes, "share preview search index", "/search-index"));
    }
    for (const r of routes) {
      const sep = r.includes("?") ? "&" : "?";
      const page = await get(`${r}${sep}share`, { cookie });
      previewHits.push(...scan(page.body, probes, "share preview HTML", r));
      const rsc = await get(`${r}${sep}share`, { cookie, rsc: true });
      previewHits.push(...scan(rsc.body, probes, "share preview RSC", r));
    }
    log(`  ${previewHits.length ? "✗" : "✓"} share preview (key holder, ?share): ${routes.length} routes`);

    // 6. Rendered DOM, in a real browser.
    const domShare = await domCheck(routes, probes, null, "");
    if (domShare.skipped) warnings.push(`DOM check skipped: ${domShare.skipped}. CI must run it.`);
    else log(`  ${domShare.hits.length ? "✗" : "✓"} rendered DOM (palette open): ${routes.length} routes`);

    for (const h of [...shareHits, ...previewHits, ...domShare.hits]) fail(`LEAK in ${h.where} at ${h.route}: “${h.probe.text}” (from: ${h.probe.from})`);

    // 7. Control: the probes must be live.
    const prepFound = new Set<string>();
    for (const r of ["/prep", "/prep/notes", "/prep/search-index", ...routes]) {
      const page = await get(r, { cookie });
      for (const h of scan(page.body, probes, "prep HTML", r)) prepFound.add(h.probe.text);
      const rsc = await get(r, { cookie, rsc: true });
      for (const h of scan(rsc.body, probes, "prep RSC", r)) prepFound.add(h.probe.text);
    }
    const domPrep = domShare.skipped ? null : await domCheck(["/prep"], probes, cookie, "");
    const coverage = prepFound.size / Math.max(1, probes.length);
    const missing = probes.filter((p) => !prepFound.has(p.text));
    if (coverage < 0.9) {
      fail(
        `CONTROL FAILED: only ${prepFound.size} of ${probes.length} probes appear in the prep view. The probes don't match how the page renders, so a pass would prove nothing. Missing, e.g.: ${missing
          .slice(0, 3)
          .map((m) => `“${m.text}”`)
          .join(", ")}`,
      );
    }
    if (domPrep && domPrep.found.size === 0) fail("CONTROL FAILED: the rendered /prep page contains none of the probes");
    log(`  ${coverage >= 0.9 ? "✓" : "✗"} control: ${prepFound.size}/${probes.length} probes found in the prep view${domPrep ? `, ${domPrep.found.size} in its rendered DOM` : ""}`);
    if (VERBOSE && missing.length) for (const m of missing) log(`      not found in prep view: “${m.text}”`);
  } finally {
    server.kill();
  }

  // Report.
  log("");
  for (const w of warnings) log(`  ! ${w}`);
  if (failures.length) {
    log(`\n✗ verify:share FAILED (${failures.length}):`);
    for (const f of [...new Set(failures)]) log(`  ✗ ${f}`);
    process.exit(1);
  }
  log(`\n✓ verify:share passed in ${((Date.now() - t0) / 1000).toFixed(1)}s. The share view carries nothing from the prep.`);
  // Remembered locally, so `npm run status` knows this content has passed.
  mkdirSync(path.join(ROOT, ".verify"), { recursive: true });
  writeFileSync(path.join(ROOT, ".verify", "last-pass.json"), JSON.stringify({ content: fingerprint, prep: prepFrom, at: new Date().toISOString() }, null, 2) + "\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

