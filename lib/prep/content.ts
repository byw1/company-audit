import "server-only";
import { cookies } from "next/headers";
import examplePrep from "@/content/prep.example";
import sealedFile from "@/content/prep.sealed.json";
import { audit } from "@/lib/content";
import { parsePrep, prepWarnings, type Prep } from "@/lib/schema/prep";
import { formatIssues } from "@/lib/schema/validate";
import { COOKIE, holds } from "./gate";
import { isSealed, open, type SealedFile } from "./seal";

/**
 * PREP ONLY. The validated prep content, decrypted from
 * content/prep.sealed.json with the key this request's cookie carries (set
 * by ?prep=<PREP_KEY>; see lib/prep/gate.ts). The server holds no key of its
 * own, so without that cookie there is nothing here to decrypt. Imported by
 * app/prep and components/prep, nothing else (eslint.config.mjs enforces it).
 *
 * Returns null without the key; the prep view then behaves as if there were
 * no prep at all. The template's own fictional example has nothing sealed:
 * its plain example prep stands in, behind the public key "demo".
 */
let opened: Promise<Prep | null> | null = null;

export async function getPrep(): Promise<Prep | null> {
  const key = (await cookies()).get(COOKIE)?.value;
  if (!key || !(await holds(key))) return null;
  // Only one key passes the check, so the first decrypt serves every later request.
  return (opened ??= load(key));
}

async function load(key: string): Promise<Prep | null> {
  const file = sealedFile as SealedFile;
  if (!isSealed(file)) return audit.config.company.fictional ? check(examplePrep) : null;
  let raw: unknown;
  try {
    raw = JSON.parse(await open(file, key));
  } catch {
    console.error("content/prep.sealed.json matched the key but didn't decrypt: the file is damaged. Run `npm run prep:seal` and redeploy.");
    return null;
  }
  return check(raw);
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
