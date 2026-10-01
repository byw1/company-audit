// Prints the Lighthouse CI runs as a markdown table (CI appends it to the job summary).
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const dir = ".lighthouseci";
let files = [];
try {
  files = readdirSync(dir).filter((f) => /^lhr-.*\.json$/.test(f));
} catch {}
if (!files.length) {
  console.log("No Lighthouse reports found.");
  process.exit(0);
}
const rows = files.map((f) => {
  const r = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
  const c = (k) => (r.categories[k] ? Math.round(r.categories[k].score * 100) : "–");
  const a = (k) => r.audits[k]?.displayValue ?? "–";
  return [r.finalDisplayedUrl ?? r.requestedUrl, c("performance"), c("accessibility"), c("best-practices"), a("largest-contentful-paint"), a("total-blocking-time"), a("cumulative-layout-shift")];
});
console.log("### Lighthouse (mobile, simulated throttling)\n");
console.log("| URL | Performance | Accessibility | Best practices | LCP | TBT | CLS |");
console.log("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
for (const r of rows) console.log(`| ${r.join(" | ")} |`);
const perf = rows.map((r) => r[1]).filter((n) => typeof n === "number").sort((x, y) => x - y);
console.log(`\nMedian performance: **${perf[Math.floor(perf.length / 2)]}** (threshold 95).`);
