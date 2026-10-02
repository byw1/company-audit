/**
 * npm run jd -- <posting URL>          is the role still listed? (title, board, index check)
 * npm run jd -- <posting URL> --save   also write the posting verbatim to content/jd.md
 *
 * Run it when you start an audit, and again the day before the interview.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fetchPosting, jdMarkdown } from "./lib/jd";

async function main() {
  const args = process.argv.slice(2);
  const url = args.find((a) => /^https?:\/\//.test(a));
  if (!url) throw new Error("Usage: npm run jd -- <posting URL> [--save]");
  const p = await fetchPosting(url);
  const status = p.onIndex === true ? "✓ listed on the careers index" : p.onIndex === false ? "✗ NOT on the careers index: the role may be closed" : "? index not checked (unsupported board): check it by hand";
  console.log(`  ${p.title || "(no title found)"}\n  ${p.board} · ${[p.team, p.location, p.published && `posted ${p.published}`].filter(Boolean).join(" · ")}\n  ${status}${p.indexUrl ? ` (${p.indexUrl})` : ""}\n  ${p.text.length} characters of posting text`);
  if (args.includes("--save")) {
    if (!p.text) throw new Error("No posting text to save.");
    const { default: config } = await import("@/content/audit.config");
    const out = path.join(process.cwd(), "content", "jd.md");
    writeFileSync(out, jdMarkdown(p, config.company.name, new Date().toISOString().slice(0, 10)));
    console.log("  ✓ saved content/jd.md");
  }
  if (p.onIndex === false) process.exitCode = 2;
}

main().catch((e) => {
  console.error(`  ✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
