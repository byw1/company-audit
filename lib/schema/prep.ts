import "server-only";
import { z } from "zod";
import { CHAPTER_IDS } from "@/lib/chapters";
import { Id, Url } from "./primitives";
import type { PublicAudit } from "./public";
import { AuditContentError, formatPath, suggest, zodIssues, type Issue } from "./validate";

/**
 * PREP ONLY. The shape of content/prep.ts. This module is allowed to know about
 * the public schema; nothing public is allowed to import this one (see
 * eslint.config.mjs).
 */

const Text = z.string().min(3);

export const PrepSchema = z.strictObject({
  /** What I say on each chapter while sharing the screen. */
  talkTrack: z
    .array(
      z.strictObject({
        chapter: z.enum(CHAPTER_IDS),
        time: z.string().optional(),
        say: Text,
        /** The question I stop and ask here. */
        ask: z.string().optional(),
        /** What to point at on screen. */
        show: z.string().optional(),
      }),
    )
    .min(1),
  likelyQuestions: z.array(z.strictObject({ q: Text, outline: Text, story: z.string().optional() })).default([]),
  pushback: z.array(z.strictObject({ push: Text, answer: Text })).default([]),
  /** Honest gaps against the JD, and how I handle each. */
  gaps: z.array(z.strictObject({ requirement: Id.optional(), gap: Text, handle: Text })).default([]),
  whosWho: z.array(z.strictObject({ name: Text, title: Text, note: Text, linkedin: Url.optional() })).default([]),
  questionsForThem: z.array(z.strictObject({ q: Text, why: Text, source: Id.optional() })).default([]),
  careful: z.array(Text).default([]),
  numbers: z.array(z.strictObject({ n: z.string().min(1), what: Text })).default([]),
  checklist: z.array(Text).default([]),
});

export type Prep = z.infer<typeof PrepSchema>;
export type PrepInput = z.input<typeof PrepSchema>;

export function parsePrep(raw: unknown, audit: PublicAudit): Prep {
  const parsed = PrepSchema.safeParse(raw);
  if (!parsed.success) throw new AuditContentError(zodIssues(parsed.error, ["prep"]));
  const prep = parsed.data;
  const issues: Issue[] = [];
  const err = (path: PropertyKey[], message: string) =>
    issues.push({ level: "error", file: "content/prep.ts", path: formatPath(path), message });

  const sourceIds = new Set(audit.sources.items.map((s) => s.id));
  const reqIds = new Set(audit.role.requirements.map((r) => r.id));
  prep.questionsForThem.forEach((q, i) => {
    if (q.source && !sourceIds.has(q.source)) err(["questionsForThem", i, "source"], `Unknown source "${q.source}"${suggest(q.source, sourceIds)}`);
  });
  prep.gaps.forEach((g, i) => {
    if (g.requirement && !reqIds.has(g.requirement))
      err(["gaps", i, "requirement"], `Unknown requirement "${g.requirement}"${suggest(g.requirement, reqIds)}`);
  });
  if (issues.length) throw new AuditContentError(issues);
  return prep;
}

/** Non-fatal: talk-track notes for chapters that are switched off are simply not shown. */
export function prepWarnings(prep: Prep, audit: PublicAudit): Issue[] {
  return prep.talkTrack.flatMap((t, i) =>
    t.chapter !== "overview" && !audit.config.modules[t.chapter]
      ? [
          {
            level: "warning" as const,
            file: "content/prep.ts",
            path: formatPath(["talkTrack", i, "chapter"]),
            message: `Chapter "${t.chapter}" is switched off in audit.config.ts, so this note won't show`,
          },
        ]
      : [],
  );
}
