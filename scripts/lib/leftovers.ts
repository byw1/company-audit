import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Traces of the template's fictional example (Northwind Commerce): its source
 * ids start "nw-", its domains end ".example", and its files say so. A real
 * audit must have none of them by the time it's sent.
 */
const MARKERS: [RegExp, string][] = [
  [/["'`]nw-[a-z0-9-]+["'`]/i, "an nw- source id"],
  [/\b[a-z0-9-]+\.example\b/i, "a .example domain"],
  [/Northwind/, "Northwind"],
  [/FICTIONAL EXAMPLE/, "the FICTIONAL EXAMPLE note"],
];

export const CONTENT_FILES = [
  "content/company.ts",
  "content/role.ts",
  "content/public-record.ts",
  "content/competitors.ts",
  "content/workflows.ts",
  "content/ideas.ts",
  "content/sources.ts",
  "content/jd.md",
];

/** File → what's left of the example in it (empty when clean). */
export function exampleLeftovers(root = process.cwd()): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const f of CONTENT_FILES) {
    const p = path.join(root, f);
    if (!existsSync(p)) continue;
    const src = readFileSync(p, "utf8");
    const hits = MARKERS.filter(([re]) => re.test(src)).map(([, what]) => what);
    if (hits.length) out[f] = hits;
  }
  return out;
}
