import "server-only";
import prepRaw from "@/content/prep";
import { audit } from "@/lib/content";
import { parsePrep, prepWarnings } from "@/lib/schema/prep";
import { formatIssues } from "@/lib/schema/validate";

/**
 * PREP ONLY. The validated prep content. Imported by app/prep and
 * components/prep, nothing else (eslint.config.mjs enforces it).
 */
export const prep = parsePrep(prepRaw, audit);

const g = globalThis as { __prepWarned?: boolean };
const warnings = prepWarnings(prep, audit);
if (warnings.length && !g.__prepWarned) {
  g.__prepWarned = true;
  console.warn(`\n${formatIssues(warnings)}\n`);
}

/** Talk-track notes keyed by chapter, for chapters that are switched on. */
export function talkTrackByChapter() {
  const on = new Set(["overview", ...Object.entries(audit.config.modules).filter(([, v]) => v).map(([k]) => k)]);
  const out: Record<string, Prep["talkTrack"]> = {};
  for (const t of prep.talkTrack) if (on.has(t.chapter)) (out[t.chapter] ??= []).push(t);
  return out;
}

type Prep = typeof prep;
