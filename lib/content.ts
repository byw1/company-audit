import "server-only";
import { notFound } from "next/navigation";
import config from "@/content/audit.config";
import company from "@/content/company";
import competitors from "@/content/competitors";
import fit from "@/content/fit";
import ideas from "@/content/ideas";
import record from "@/content/public-record";
import role from "@/content/role";
import sources from "@/content/sources";
import workflows from "@/content/workflows";
import { CHAPTERS, type Chapter } from "@/lib/chapters";
import { formatIssues, parsePublic, walkFacts } from "@/lib/schema/validate";

/**
 * The public audit, validated. Parsing happens when this module is first
 * imported, so a missing source, an unlabelled fact or a broken reference
 * fails `next build` (and `npm run validate` prints the same report).
 */
const { audit, warnings } = parsePublic({ config, company, role, workflows, record, competitors, ideas, sources, fit });

const g = globalThis as { __auditWarned?: boolean };
if (warnings.length && !g.__auditWarned) {
  g.__auditWarned = true;
  console.warn(`\n${formatIssues(warnings)}\n`);
}

export { audit };

/** 404 a chapter that's switched off in audit.config.ts. */
export function requireModule(id: keyof typeof audit.config.modules) {
  if (!audit.config.modules[id]) notFound();
}

/** Chapters switched on in audit.config.ts, in reading order. The overview is always on. */
export const chapters: Chapter[] = CHAPTERS.filter((c) => c.id === "overview" || audit.config.modules[c.id]);

export const sourceById = new Map(audit.sources.items.map((s) => [s.id, s]));
/** Sources are numbered in the order sources.ts lists them; claims cite them as [n]. */
export const sourceNumber = new Map(audit.sources.items.map((s, i) => [s.id, i + 1]));
export const workflowById = new Map(audit.workflows.map((w) => [w.id, w]));
export const competitorById = new Map(audit.competitors.field.map((c) => [c.id, c]));
export const recordById = new Map(audit.record.items.map((r) => [r.id, r]));
export const ideaById = new Map(audit.ideas.items.map((i) => [i.id, i]));
export const responsibilityById = new Map(audit.role.responsibilities.map((r) => [r.id, r]));
export const requirementById = new Map(audit.role.requirements.map((r) => [r.id, r]));

/** How many claims cite each source (for /sources). */
export const citationCount = (() => {
  const counts = new Map<string, number>();
  const { config: _c, ...content } = audit;
  void _c;
  for (const { fact } of walkFacts(content)) for (const id of fact.sources ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const h of audit.record.hiring) counts.set(h.source, (counts.get(h.source) ?? 0) + 1);
  counts.set(audit.config.role.jdSource, (counts.get(audit.config.role.jdSource) ?? 0) + 1);
  return counts;
})();

/** How many claims of each kind the public site carries. */
export const factCounts = (() => {
  const counts = { sourced: 0, inferred: 0, illustrative: 0 };
  const { config: _c, fit: _f, ...content } = audit;
  void _c;
  void _f;
  for (const { fact } of walkFacts(content)) if (fact.basis in counts) counts[fact.basis as keyof typeof counts]++;
  return counts;
})();

/** Plain-words position on the competitor map, for screen readers and the table view. */
export function describePosition(p: { x: number; y: number }) {
  const { x, y } = audit.competitors.axes;
  const side = (v: number, a: { low: string; high: string }) =>
    v < 35 ? a.low.toLowerCase() : v > 65 ? a.high.toLowerCase() : `between ${a.low.toLowerCase()} and ${a.high.toLowerCase()}`;
  return `${side(p.x, x)}; ${side(p.y, y)}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "Researched September 2026". */
export const researchedLabel = (() => {
  const [y, m] = audit.config.researched.split("-").map(Number);
  return `Researched ${MONTHS[m - 1]} ${y}`;
})();

/** "2025-06-14" → "Jun 14, 2025"; "2025-06" → "Jun 2025"; "2025" → "2025". */
export function formatDate(d: string, style: "short" | "long" = "short") {
  const [y, m, day] = d.split("-").map(Number);
  if (!m) return String(y);
  const month = style === "long" ? MONTHS[m - 1] : MONTHS[m - 1].slice(0, 3);
  return day ? `${month} ${day}, ${y}` : `${month} ${y}`;
}

export function hostOf(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}
