import "server-only";
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
 * prep view then behaves as if there were no prep at all.
 */
let cached: { secret: string; prep: Promise<Prep | null> } | null = null;

export function getPrep(): Promise<Prep | null> {
  const secret = process.env.PREP_SECRET;
  if (!secret || !isSealed(sealedFile)) return Promise.resolve(null);
  if (cached?.secret !== secret) cached = { secret, prep: load(secret) };
  return cached.prep;
}

async function load(secret: string): Promise<Prep | null> {
  if (!isSealed(sealedFile)) return null;
  let json: string;
  try {
    json = await unseal(sealedFile, secret);
  } catch {
    console.error("content/prep.sealed.json could not be decrypted with PREP_SECRET. Re-run `npm run prep:seal` with the secret this deploy uses.");
    return null;
  }
  const prep = parsePrep(JSON.parse(json), audit);
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
