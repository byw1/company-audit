import { z } from "zod";
import { PublicAuditSchema, type PublicAudit } from "./public";

/**
 * Parse and cross-check the public content. Schema problems and broken
 * references are errors (they fail the build); stale or unused material is a
 * warning (printed, not fatal).
 */

export interface Issue {
  level: "error" | "warning";
  file: string;
  path: string;
  message: string;
}

export const FILE_FOR: Record<string, string> = {
  config: "content/audit.config.ts",
  company: "content/company.ts",
  role: "content/role.ts",
  workflows: "content/workflows.ts",
  record: "content/public-record.ts",
  competitors: "content/competitors.ts",
  ideas: "content/ideas.ts",
  sources: "content/sources.ts",
  fit: "content/fit.ts",
  prep: "content/prep.ts",
};

export function formatPath(path: PropertyKey[]): string {
  return path
    .map((p) => (typeof p === "number" ? `[${p}]` : `.${String(p)}`))
    .join("")
    .replace(/^\./, "");
}

export function zodIssues(error: z.ZodError, prefix: PropertyKey[] = []): Issue[] {
  return error.issues.map((i) => {
    const full = [...prefix, ...i.path];
    const [head, ...rest] = full;
    return {
      level: "error" as const,
      file: FILE_FOR[String(head)] ?? String(head ?? "content"),
      path: formatPath(rest),
      message: i.message,
    };
  });
}

export class AuditContentError extends Error {
  issues: Issue[];
  constructor(issues: Issue[]) {
    super(formatIssues(issues));
    this.name = "AuditContentError";
    this.issues = issues;
  }
}

export function formatIssues(issues: Issue[]): string {
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  const line = (i: Issue) => `  ${i.level === "error" ? "✗" : "!"} ${i.file}${i.path ? ` › ${i.path}` : ""}\n      ${i.message}`;
  const parts: string[] = [];
  if (errors.length) {
    parts.push(`Audit content failed validation (${errors.length} problem${errors.length === 1 ? "" : "s"}):`);
    parts.push(...errors.map(line));
  }
  if (warnings.length) {
    parts.push(`${warnings.length} warning${warnings.length === 1 ? "" : "s"}:`);
    parts.push(...warnings.map(line));
  }
  return parts.join("\n");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function distance(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

export function suggest(id: string, known: Iterable<string>): string {
  let best: string | null = null;
  let bestD = Infinity;
  for (const k of known) {
    const d = distance(id, k);
    if (d < bestD) {
      best = k;
      bestD = d;
    }
  }
  return best && bestD <= Math.max(2, Math.floor(id.length / 3)) ? ` (did you mean "${best}"?)` : "";
}

/** Every claim object in a tree, with its path. */
export function* walkFacts(
  node: unknown,
  path: PropertyKey[] = [],
): Generator<{ fact: { basis: string; sources?: string[]; text?: string }; path: PropertyKey[] }> {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* walkFacts(node[i], [...path, i]);
    return;
  }
  if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (typeof o.basis === "string" && typeof o.text === "string") {
      yield { fact: o as { basis: string; sources?: string[]; text?: string }, path };
    }
    for (const [k, v] of Object.entries(o)) yield* walkFacts(v, [...path, k]);
  }
}

function duplicates(ids: string[]) {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const id of ids) (seen.has(id) ? dup : seen).add(id);
  return [...dup];
}

/** "2025-06" → a comparable day string at the start of the period. */
function startOf(date: string) {
  return date.length === 4 ? `${date}-01-01` : date.length === 7 ? `${date}-01` : date;
}

function monthsBetween(a: string, b: string) {
  const [ay, am] = startOf(a).split("-").map(Number);
  const [by, bm] = startOf(b).split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

export function isoToday(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

// ── Cross-file checks ────────────────────────────────────────────────────────

export function crossCheck(a: PublicAudit, today = isoToday()): Issue[] {
  const issues: Issue[] = [];
  const err = (key: string, path: PropertyKey[], message: string) =>
    issues.push({ level: "error", file: FILE_FOR[key], path: formatPath(path), message });
  const warn = (key: string, path: PropertyKey[], message: string) =>
    issues.push({ level: "warning", file: FILE_FOR[key], path: formatPath(path), message });

  // Sources
  const sourceIds = new Set(a.sources.items.map((s) => s.id));
  for (const d of duplicates(a.sources.items.map((s) => s.id))) err("sources", ["items"], `Duplicate source id "${d}"`);
  a.sources.items.forEach((s, i) => {
    if (s.accessed > today) err("sources", ["items", i, "accessed"], `Accessed date ${s.accessed} is in the future`);
    if (s.published && startOf(s.published) > s.accessed)
      err("sources", ["items", i, "published"], `Published ${s.published} is after it was accessed (${s.accessed})`);
  });

  if (`${a.config.researched}-01` > today) err("config", ["researched"], `Researched month ${a.config.researched} is in the future`);

  // Every claim's source ids resolve.
  const cited = new Set<string>();
  for (const key of Object.keys(a) as (keyof PublicAudit)[]) {
    for (const { fact, path } of walkFacts(a[key])) {
      for (const [i, id] of (fact.sources ?? []).entries()) {
        cited.add(id);
        if (!sourceIds.has(id)) err(key, [...path, "sources", i], `Unknown source "${id}"${suggest(id, sourceIds)}`);
      }
    }
  }

  // The JD is a source, and it's a posting.
  const jd = a.sources.items.find((s) => s.id === a.config.role.jdSource);
  if (!jd) err("config", ["role", "jdSource"], `Unknown source "${a.config.role.jdSource}"${suggest(a.config.role.jdSource, sourceIds)}`);
  else {
    cited.add(jd.id);
    if (jd.kind !== "job-posting") warn("config", ["role", "jdSource"], `Source "${jd.id}" is a ${jd.kind}, not a job-posting`);
  }

  // Role
  const respIds = new Set(a.role.responsibilities.map((r) => r.id));
  for (const d of duplicates(a.role.responsibilities.map((r) => r.id))) err("role", ["responsibilities"], `Duplicate responsibility id "${d}"`);
  for (const d of duplicates(a.role.requirements.map((r) => r.id))) err("role", ["requirements"], `Duplicate requirement id "${d}"`);
  const p = a.role.placement;
  const nodes = [...p.above, p.reportsTo, ...p.peers, ...p.reports, ...p.upstream, ...p.downstream];
  for (const d of duplicates(nodes.map((n) => n.id))) err("role", ["placement"], `Duplicate org node id "${d}"`);

  // Workflows
  for (const d of duplicates(a.workflows.map((w) => w.id))) err("workflows", [], `Duplicate workflow id "${d}"`);
  const mapped = new Set<string>();
  a.workflows.forEach((w, wi) => {
    const stageIds = new Set(w.stages.map((s) => s.id));
    for (const d of duplicates(w.stages.map((s) => s.id))) err("workflows", [wi, "stages"], `Duplicate stage id "${d}" in "${w.id}"`);
    for (const d of duplicates(w.leaks.map((l) => l.id))) err("workflows", [wi, "leaks"], `Duplicate leak id "${d}" in "${w.id}"`);
    w.jd.forEach((r, i) => {
      mapped.add(r);
      if (!respIds.has(r)) err("workflows", [wi, "jd", i], `Unknown responsibility "${r}"${suggest(r, respIds)} (see content/role.ts)`);
    });
    w.leaks.forEach((l, i) => {
      if (!stageIds.has(l.at)) err("workflows", [wi, "leaks", i, "at"], `Stage "${l.at}" doesn't exist in workflow "${w.id}"${suggest(l.at, stageIds)}`);
    });
    w.links.forEach((l, i) => {
      if (!stageIds.has(l.from)) err("workflows", [wi, "links", i, "from"], `Stage "${l.from}" doesn't exist in workflow "${w.id}"${suggest(l.from, stageIds)}`);
      if (!stageIds.has(l.to)) err("workflows", [wi, "links", i, "to"], `Stage "${l.to}" doesn't exist in workflow "${w.id}"${suggest(l.to, stageIds)}`);
    });
  });
  if (a.config.modules.workflows)
    a.role.responsibilities.forEach((r, i) => {
      if (!mapped.has(r.id)) warn("role", ["responsibilities", i], `Responsibility "${r.id}" isn't mapped to any workflow`);
    });

  // Record
  const recordIds = new Set(a.record.items.map((r) => r.id));
  for (const d of duplicates(a.record.items.map((r) => r.id))) err("record", ["items"], `Duplicate record id "${d}"`);
  for (const d of duplicates(a.record.hiring.map((r) => r.id))) err("record", ["hiring"], `Duplicate hiring id "${d}"`);
  a.record.hiring.forEach((h, i) => {
    cited.add(h.source);
    if (!sourceIds.has(h.source)) err("record", ["hiring", i, "source"], `Unknown source "${h.source}"${suggest(h.source, sourceIds)}`);
  });

  // Competitors
  const compIds = new Set(a.competitors.field.map((c) => c.id));
  for (const d of duplicates(a.competitors.field.map((c) => c.id))) err("competitors", ["field"], `Duplicate competitor id "${d}"`);
  a.competitors.field.forEach((c, ci) => {
    c.moves.forEach((m, mi) => {
      if (monthsBetween(m.date, a.config.researched) > 15)
        warn("competitors", ["field", ci, "moves", mi, "date"], `A ${m.date} move is more than a year before the research date; direction of travel should rest on the last twelve months`);
    });
  });

  // Ideas
  const ideaIds = new Set(a.ideas.items.map((i) => i.id));
  for (const d of duplicates(a.ideas.items.map((i) => i.id))) err("ideas", ["items"], `Duplicate idea id "${d}"`);
  const leakKeys = new Set(a.workflows.flatMap((w) => w.leaks.map((l) => `${w.id}/${l.id}`)));
  a.ideas.items.forEach((idea, ii) => {
    idea.traces.forEach((t, ti) => {
      const [kind, ref] = t.split(":");
      const known = kind === "leak" ? leakKeys : kind === "record" ? recordIds : compIds;
      if (!known.has(ref)) err("ideas", ["items", ii, "traces", ti], `"${t}" doesn't resolve${suggest(ref, known)}`);
    });
  });
  const windows = a.ideas.plan.map((p) => p.window).sort();
  if (windows.join(",") !== "30,60,90") err("ideas", ["plan"], `The plan needs one entry each for 30, 60 and 90 days (got ${windows.join(", ")})`);
  a.ideas.plan.forEach((p, pi) =>
    p.ideas.forEach((id, i) => {
      if (!ideaIds.has(id)) err("ideas", ["plan", pi, "ideas", i], `Unknown idea "${id}"${suggest(id, ideaIds)}`);
    }),
  );

  // Fit
  const reqIds = new Set(a.role.requirements.map((r) => r.id));
  a.fit.rows.forEach((r, i) => {
    if (!reqIds.has(r.requirement))
      (a.config.modules.fit ? err : warn)("fit", ["rows", i, "requirement"], `Unknown requirement "${r.requirement}"${suggest(r.requirement, reqIds)} (see content/role.ts)`);
  });
  if (a.config.modules.fit && a.fit.rows.length === 0) err("fit", ["rows"], "The fit module is on but has no rows");

  // Unused sources
  a.sources.items.forEach((s, i) => {
    if (!cited.has(s.id)) warn("sources", ["items", i], `Source "${s.id}" is never cited`);
  });

  return issues;
}

export function parsePublic(raw: Record<string, unknown>, today = isoToday()) {
  const parsed = PublicAuditSchema.safeParse(raw);
  if (!parsed.success) throw new AuditContentError(zodIssues(parsed.error));
  const issues = crossCheck(parsed.data, today);
  if (issues.some((i) => i.level === "error")) throw new AuditContentError(issues);
  return { audit: parsed.data, warnings: issues };
}
