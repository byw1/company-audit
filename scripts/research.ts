/**
 * Research helpers. Everything lands in research/, which the site never
 * reads: it's working material for writing content/ and for the fact-check.
 *
 * npm run research:hiring    every open role on the company's board, by team
 *                            (Ashby, Greenhouse, Lever): where they're hiring
 * npm run research:sec       public companies: recent filings and reported
 *                            revenue from SEC EDGAR, with links to cite
 * npm run research:sources   a dated text copy of every source, so the
 *                            fact-check never depends on a page that changed
 * npm run refresh            before you send it again: is the role still
 *                            listed, which sources are old, what to re-check
 *
 * Runs with --conditions=react-server so `server-only` resolves to a no-op.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fetchPosting, htmlToText, listBoard } from "./lib/jd";
import { loadPublic } from "./lib/audit";
import { ROOT } from "./lib/env";

const OUT = path.join(ROOT, "research");
const today = () => new Date().toISOString().slice(0, 10);
const write = (rel: string, body: string) => {
  const p = path.join(OUT, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, body);
  return path.relative(ROOT, p);
};

async function hiring() {
  const { audit } = loadPublic();
  const board = await listBoard(audit.config.role.jdUrl);
  if (!board) throw new Error("The posting isn't on Ashby, Greenhouse or Lever, so there's no board API to list. Read the careers page by hand.");
  const byTeam = new Map<string, typeof board.jobs>();
  for (const j of board.jobs) byTeam.set(j.team, [...(byTeam.get(j.team) ?? []), j]);
  const teams = [...byTeam.entries()].sort((a, b) => b[1].length - a[1].length);
  const lines = [
    `# Open roles at ${audit.config.company.name}`,
    "",
    `Read ${today()} from ${board.indexUrl}: ${board.jobs.length} open roles across ${teams.length} teams.`,
    "Cite the board as a source (kind \"careers\") with this date as `accessed`.",
    "",
    "| Team | Open roles |",
    "| --- | --- |",
    ...teams.map(([t, js]) => `| ${t} | ${js.length} |`),
    "",
    ...teams.flatMap(([t, js]) => [`## ${t}`, "", ...js.map((j) => `- ${j.title}${j.location ? ` · ${j.location}` : ""}${j.published ? ` · ${j.published}` : ""}${j.url ? ` · ${j.url}` : ""}`), ""]),
  ];
  write("hiring.json", JSON.stringify({ read: today(), indexUrl: board.indexUrl, jobs: board.jobs }, null, 2) + "\n");
  console.log(`  ✓ ${write("hiring.md", lines.join("\n"))}: ${board.jobs.length} roles, ${teams.length} teams`);
  for (const [t, js] of teams.slice(0, 5)) console.log(`    ${String(js.length).padStart(3)}  ${t}`);
}

async function sec() {
  const { audit } = loadPublic();
  const ticker = (process.argv[3] ?? audit.config.company.ticker ?? "").toUpperCase();
  if (!ticker) throw new Error("No ticker: set company.ticker in content/audit.config.ts, or pass one (npm run research:sec -- ACME). Private companies don't file with the SEC.");
  // The SEC asks every client to say who it is.
  const ua = { "user-agent": `company-audit research ${audit.config.author.email}` };
  const get = async <T>(url: string) => {
    const r = await fetch(url, { headers: ua, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`${url} returned ${r.status}`);
    return r.json() as Promise<T>;
  };
  const tickers = await get<Record<string, { cik_str: number; ticker: string; title: string }>>("https://www.sec.gov/files/company_tickers.json");
  const hit = Object.values(tickers).find((t) => t.ticker === ticker);
  if (!hit) throw new Error(`${ticker} isn't in the SEC's ticker list (private, foreign-listed, or a typo).`);
  const cik = String(hit.cik_str).padStart(10, "0");
  const subs = await get<{ filings: { recent: { form: string[]; filingDate: string[]; accessionNumber: string[]; primaryDocument: string[]; reportDate: string[] } } }>(
    `https://data.sec.gov/submissions/CIK${cik}.json`,
  );
  const r = subs.filings.recent;
  const filings = r.form
    .map((form, i) => ({ form, filed: r.filingDate[i], period: r.reportDate[i], url: `https://www.sec.gov/Archives/edgar/data/${hit.cik_str}/${r.accessionNumber[i].replace(/-/g, "")}/${r.primaryDocument[i]}` }))
    .filter((f) => ["10-K", "10-Q", "8-K", "20-F", "S-1", "DEF 14A"].includes(f.form))
    .slice(0, 20);
  type Fact = { end: string; val: number; fy: number; fp: string; form: string; filed: string };
  const facts = await get<{ facts: { "us-gaap"?: Record<string, { units: { USD?: Fact[] } }> } }>(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`).catch(() => null);
  const gaap = facts?.facts["us-gaap"] ?? {};
  const concept = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet"].find((c) => gaap[c]?.units.USD?.length);
  const annual = concept
    ? [...new Map((gaap[concept].units.USD ?? []).filter((f) => f.form === "10-K" && f.fp === "FY").map((f) => [f.end, f])).values()].sort((a, b) => b.end.localeCompare(a.end)).slice(0, 5)
    : [];
  const lines = [
    `# ${hit.title} (${ticker}) at the SEC`,
    "",
    `Read ${today()} from EDGAR (CIK ${cik}). Cite the filing itself, not this file: each figure below names the 10-K it was reported in.`,
    "",
    "## Reported annual revenue",
    "",
    ...(annual.length
      ? ["| Fiscal year ending | Revenue (USD) | Reported in | Filed |", "| --- | --- | --- | --- |", ...annual.map((f) => `| ${f.end} | ${f.val.toLocaleString("en-US")} | ${f.form} FY${f.fy} | ${f.filed} |`), "", `XBRL concept: \`${concept}\`. Never round these; use the exact figure.`]
      : ["No tagged revenue found; read the income statement in the latest 10-K."]),
    "",
    "## Recent filings",
    "",
    "The 10-K's Item 1 (Business) lists who the company says it competes with: use it to pick competitors.",
    "",
    ...filings.map((f) => `- ${f.form} · filed ${f.filed}${f.period ? ` · period ${f.period}` : ""} · ${f.url}`),
    "",
  ];
  console.log(`  ✓ ${write("sec.md", lines.join("\n"))}: ${annual.length} years of revenue, ${filings.length} filings`);
}

async function snapshot(url: string, email: string) {
  // The SEC refuses anonymous clients; everyone else gets a browser-like agent.
  const ua = /(^|\.)sec\.gov$/.test(new URL(url).hostname) ? `company-audit research ${email}` : "Mozilla/5.0 (company-audit source snapshot)";
  const r = await fetch(url, { headers: { "user-agent": ua }, redirect: "follow", signal: AbortSignal.timeout(25000) });
  const type = r.headers.get("content-type") ?? "";
  if (!r.ok) return { status: r.status, text: "" };
  if (!/html|text|json|xml/.test(type)) return { status: r.status, text: `(${type || "binary"} file: not converted; open the URL)` };
  return { status: r.status, text: htmlToText(await r.text()) };
}

async function sources() {
  const { audit } = loadPublic();
  const items = audit.sources.items.filter((s) => /^https?:\/\//.test(s.url) && !/\.example(\/|$)/.test(new URL(s.url).hostname));
  let ok = 0;
  const failed: string[] = [];
  const queue = [...items];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let s = queue.shift(); s; s = queue.shift()) {
        const got = await snapshot(s.url, audit.config.author.email).catch((e: Error) => ({ status: 0, text: "", error: e.message }));
        if (!got.text) {
          failed.push(`${s.id} (${got.status || "no response"})`);
          continue;
        }
        ok++;
        write(path.join("sources", `${s.id}.md`), `# ${s.title}\n\n- URL: ${s.url}\n- Publisher: ${s.publisher}\n- Snapshot: ${today()} (HTTP ${got.status})\n- Cited as accessed: ${s.accessed}\n\n---\n\n${got.text.slice(0, 200_000)}\n`);
      }
    }),
  );
  console.log(`  ✓ research/sources/: ${ok} of ${items.length} sources saved as text`);
  if (failed.length) console.log(`  ! couldn't fetch ${failed.length}: ${failed.join(", ")}. Keep those pages open, or save a PDF by hand.`);
}

async function refresh() {
  const { audit } = loadPublic();
  const lines = [`# Refresh, ${today()}`, ""];
  // 1. Is the role still listed?
  try {
    const p = await fetchPosting(audit.config.role.jdUrl);
    const state = p.onIndex === true ? "still listed on the careers index" : p.onIndex === false ? "**NOT on the careers index any more: the role may be closed**" : "index not checkable automatically: look by hand";
    lines.push(`- The role: ${state}${p.indexUrl ? ` (${p.indexUrl})` : ""}.`);
    console.log(`  ${p.onIndex === false ? "✗" : "✓"} role ${state.replace(/\*/g, "")}`);
  } catch (e) {
    lines.push(`- The role: couldn't fetch the posting (${(e as Error).message}).`);
  }
  // 2. How old is the research?
  const now = Date.now();
  const age = (d: string) => Math.floor((now - Date.parse(d)) / 86_400_000);
  const old = audit.sources.items.filter((s) => age(s.accessed) > 45).sort((a, b) => a.accessed.localeCompare(b.accessed));
  lines.push(`- Researched ${audit.config.researched}. ${old.length} of ${audit.sources.items.length} sources were read more than 45 days ago${old.length ? ":" : "."}`);
  for (const s of old) lines.push(`  - ${s.id}: ${s.title} (accessed ${s.accessed}, ${age(s.accessed)} days)`);
  console.log(`  ${old.length ? "!" : "✓"} ${old.length} sources older than 45 days`);
  // 3. What Claude does next, with the web.
  lines.push(
    "",
    "## To do",
    "",
    `1. Search for ${audit.config.company.name} news since ${audit.config.researched}: funding, launches, leadership changes, earnings, layoffs. Add what matters to public-record.ts, sourced and dated.`,
    "2. Re-read each old source above. Where a number changed, update it with the new date; never keep a stale figure.",
    "3. Each competitor's moves must still fall within the last twelve months (`npm run validate` warns).",
    "4. `npm run research:hiring` again: changes in where they hire are a signal.",
    "5. Set `researched` in audit.config.ts to this month, then `npm run check`, the fact-check on what changed, and `npm run verify:share`.",
    "",
  );
  console.log(`  ✓ ${write("refresh.md", lines.join("\n"))}: the checklist for the rest`);
  if (existsSync(path.join(ROOT, "content", "jd.md")) && /NOT on the careers index/.test(readFileSync(path.join(ROOT, "content", "jd.md"), "utf8"))) console.log("  ! content/jd.md already records the role as unlisted");
}

const cmds: Record<string, () => Promise<void>> = { hiring, sec, sources, refresh };
const cmd = process.argv[2] ?? "";
if (!cmds[cmd]) {
  console.error(`  ✗ Unknown command "${cmd}" (${Object.keys(cmds).join(", ")})`);
  process.exit(1);
}
cmds[cmd]().catch((e) => {
  console.error(`  ✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
