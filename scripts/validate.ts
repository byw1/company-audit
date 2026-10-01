/**
 * npm run validate — parse and cross-check everything in content/, public and
 * prep, and print every problem at once. `next build` runs the same checks
 * (lib/content.ts validates on import), so this is the fast, readable version.
 *
 * Runs with --conditions=react-server so `server-only` resolves to a no-op.
 */
import config from "@/content/audit.config";
import company from "@/content/company";
import competitors from "@/content/competitors";
import fit from "@/content/fit";
import ideas from "@/content/ideas";
import prepRaw from "@/content/prep";
import record from "@/content/public-record";
import role from "@/content/role";
import sources from "@/content/sources";
import workflows from "@/content/workflows";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parsePrep, prepWarnings } from "@/lib/schema/prep";
import { AuditContentError, formatIssues, parsePublic, type Issue } from "@/lib/schema/validate";

function main() {
  let warnings: Issue[] = [];
  try {
    const { audit, warnings: w } = parsePublic({ config, company, role, workflows, record, competitors, ideas, sources, fit });
    warnings = w;
    const prep = parsePrep(prepRaw, audit);
    warnings.push(...prepWarnings(prep, audit));

    const quoteIssues = checkJdQuotes({ company, role, workflows, record, competitors, ideas }, audit.config.role.jdSource);
    if (quoteIssues.length) throw new AuditContentError(quoteIssues);

    const facts = countFacts({ company, role, workflows, record, competitors, ideas, sources });
    if (warnings.length) console.warn(formatIssues(warnings) + "\n");
    console.log(
      `✓ Content is valid: ${audit.config.company.name} · ${audit.config.role.title}\n` +
        `  ${facts.sourced} sourced, ${facts.inferred} outside-in reads, ${facts.illustrative} illustrative · ` +
        `${audit.sources.items.length} sources · ${audit.workflows.length} workflows · ` +
        `${audit.competitors.field.length} competitors · ${audit.ideas.items.length} ideas`,
    );
  } catch (e) {
    if (e instanceof AuditContentError) {
      console.error(e.message);
      process.exit(1);
    }
    throw e;
  }
}

/**
 * Every quote() sourced to the job posting must appear word for word in
 * content/jd.md (whitespace and non-breaking spaces aside). Only the JD is
 * saved locally, so this is the one quote the validator can check itself;
 * the fact-checker covers the rest.
 */
function checkJdQuotes(files: Record<string, unknown>, jdSource: string): Issue[] {
  const jdPath = path.join(process.cwd(), "content", "jd.md");
  if (!existsSync(jdPath)) return [];
  const norm = (t: string) => t.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const jd = norm(readFileSync(jdPath, "utf8"));
  const issues: Issue[] = [];
  const walk = (n: unknown, file: string, at: string) => {
    if (Array.isArray(n)) return n.forEach((v, i) => walk(v, file, `${at}[${i}]`));
    if (!n || typeof n !== "object") return;
    const o = n as Record<string, unknown>;
    if (o.quote === true && Array.isArray(o.sources) && o.sources.includes(jdSource) && typeof o.text === "string" && !jd.includes(norm(o.text)))
      issues.push({
        level: "error",
        file: `content/${file}.ts`,
        path: at.replace(/^\./, ""),
        message: `Quoted from the posting but not found word for word in content/jd.md: "${o.text.slice(0, 80)}${o.text.length > 80 ? "…" : ""}"`,
      });
    for (const [k, v] of Object.entries(o)) walk(v, file, `${at}.${k}`);
  };
  for (const [file, tree] of Object.entries(files)) walk(tree, file === "record" ? "public-record" : file, "");
  return issues;
}

function countFacts(tree: unknown) {
  const counts = { sourced: 0, inferred: 0, illustrative: 0 };
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object") {
      const o = n as Record<string, unknown>;
      if (typeof o.basis === "string" && o.basis in counts) counts[o.basis as keyof typeof counts]++;
      Object.values(o).forEach(walk);
    }
  };
  walk(tree);
  return counts;
}

main();
