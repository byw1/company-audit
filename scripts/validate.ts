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
import { parsePrep, prepWarnings } from "@/lib/schema/prep";
import { AuditContentError, formatIssues, parsePublic, type Issue } from "@/lib/schema/validate";

function main() {
  let warnings: Issue[] = [];
  try {
    const { audit, warnings: w } = parsePublic({ config, company, role, workflows, record, competitors, ideas, sources, fit });
    warnings = w;
    const prep = parsePrep(prepRaw, audit);
    warnings.push(...prepWarnings(prep, audit));

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
