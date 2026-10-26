/**
 * npm run views -- <log file>   (or pipe logs in: … | npm run -s views)
 *
 * Who opened the site, and which chapters they read. The site writes one log
 * line per page view (middleware.ts): the page, the recipient if the link was
 * personal (?for=jane), and the view. No IP, no user agent, no identifier.
 * Get the lines from the host: with Claude's Railway connector, `get-logs`
 * on the service's deploy stream, filtered to "audit_view"; or Railway →
 * the service → Logs, search audit_view, and download.
 *
 * Your own prep-view visits are left out.
 */
import { readFileSync } from "node:fs";

interface View {
  audit_view: string;
  for: string | null;
  view: "prep" | "share";
  at: string;
}

function main() {
  const file = process.argv[2];
  const text = file ? readFileSync(file, "utf8") : readFileSync(0, "utf8");
  const views: View[] = [];
  for (const m of text.matchAll(/\{[^{}]*"audit_view"[^{}]*\}/g)) {
    try {
      const v = JSON.parse(m[0]) as View;
      if (v.view !== "prep") views.push(v);
    } catch {}
  }
  if (!views.length) return console.log("  No page views found. Look for log lines containing audit_view.");
  const who = new Map<string, View[]>();
  for (const v of views) who.set(v.for ?? "(no name)", [...(who.get(v.for ?? "(no name)") ?? []), v]);
  console.log(`\n  ${views.length} page views\n`);
  for (const [name, vs] of [...who.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const pages = new Map<string, number>();
    for (const v of vs) pages.set(v.audit_view, (pages.get(v.audit_view) ?? 0) + 1);
    const times = vs.map((v) => v.at).sort();
    console.log(`  ${name}: ${vs.length} views, ${times[0].slice(0, 16).replace("T", " ")} → ${times[times.length - 1].slice(0, 16).replace("T", " ")} UTC`);
    for (const [pg, n] of [...pages.entries()].sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(3)}  ${pg}`);
  }
  console.log("");
}

main();
