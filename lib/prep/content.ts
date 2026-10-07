import "server-only";
import examplePrep from "@/content/prep.example";
import sealedFile from "@/content/prep.sealed.json";
import { audit } from "@/lib/content";
import { parsePrep, prepWarnings, type Prep } from "@/lib/schema/prep";
import { formatIssues } from "@/lib/schema/validate";
import { isSealed, unseal } from "./seal";

/**
 * PREP ONLY. The validated prep content, decrypted from
 * content/prep.sealed.json with PREP_SECRET. Imported by app/prep and
 * components/prep, nothing else (eslint.config.mjs enforces it).
 *
 * Returns null when nothing is sealed or the secret is missing or wrong; the
 * prep view then behaves as if there were no prep at all. The one exception
 * is the template's own fictional example: there, the plain example prep
 * stands in, so anyone trying the template sees the whole prep view.
 */
let cached: { secret: string; prep: Promise<Prep | null> } | null = null;

export function getPrep(): Promise<Prep | null> {
  const secret = process.env.PREP_SECRET ?? "";
  if (cached?.secret !== secret) cached = { secret, prep: load(secret) };
  return cached.prep;
}

async function load(secret: string): Promise<Prep | null> {
  const raw = await open(secret);
  if (raw === null) return audit.config.company.fictional ? check(examplePrep) : null;
  return check(raw);
}

async function open(secret: string): Promise<unknown | null> {
  if (!secret || !isSealed(sealedFile)) return null;
  try {
    return JSON.parse(await unseal(sealedFile, secret));
  } catch {
    if (!audit.config.company.fictional)
      console.error("content/prep.sealed.json could not be decrypted with PREP_SECRET. Re-run `npm run prep:seal` with the secret this deploy uses.");
    return null;
  }
}

function check(raw: unknown): Prep {
  const prep = parsePrep(raw, audit);
  const warnings = prepWarnings(prep, audit);
  if (warnings.length) console.warn(`\n${formatIssues(warnings)}\n`);
  return prep;
}

/** Talk-track notes keyed by chapter, for chapters that are switched on. */
export function talkTrackByChapter(prep: Prep) {
  const on = new Set(["overview", ...Object.entries(audit.config.modules).filter(([, v]) => v).map(([k]) => k)]);
  const out: Record<string, Prep["talkTrack"]> = {};
  for (const t of prep.talkTrack) if (on.has(t.chapter)) (out[t.chapter] ??= []).push(t);
  return out;
}
