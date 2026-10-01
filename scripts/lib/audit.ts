import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import config from "@/content/audit.config";
import company from "@/content/company";
import competitors from "@/content/competitors";
import fit from "@/content/fit";
import ideas from "@/content/ideas";
import record from "@/content/public-record";
import role from "@/content/role";
import sources from "@/content/sources";
import workflows from "@/content/workflows";
import { isSealed, unseal, type SealedFile } from "@/lib/prep/seal";
import { parsePublic } from "@/lib/schema/validate";
import { envVar, ROOT } from "./env";

/** Scripts run with --conditions=react-server, so `server-only` resolves to a no-op. */
export const rawPublic = { config, company, role, workflows, record, competitors, ideas, sources, fit };
export const loadPublic = () => parsePublic(rawPublic);

export const PREP_PLAIN = path.join(ROOT, "content", "prep.ts");
export const PREP_EXAMPLE = path.join(ROOT, "content", "prep.example.ts");
export const PREP_SEALED = path.join(ROOT, "content", "prep.sealed.json");

/** content/prep.ts, or (with allowExample) the template's fictional example. */
export async function loadPrepPlain({ allowExample = false } = {}): Promise<{ raw: unknown; file: string } | null> {
  const file = existsSync(PREP_PLAIN) ? PREP_PLAIN : allowExample && existsSync(PREP_EXAMPLE) ? PREP_EXAMPLE : null;
  if (!file) return null;
  // A query string makes every call a fresh import, so --watch sees each save.
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  return { raw: mod.default, file };
}

export function readSealed(): SealedFile {
  if (!existsSync(PREP_SEALED)) return { v: 0 };
  return JSON.parse(readFileSync(PREP_SEALED, "utf8"));
}

/** The sealed prep, decrypted with PREP_SECRET; null if there's nothing sealed or no secret. */
export async function loadPrepSealed(secret = envVar("PREP_SECRET")): Promise<unknown | null> {
  const sealed = readSealed();
  if (!secret || !isSealed(sealed)) return null;
  return JSON.parse(await unseal(sealed, secret));
}
