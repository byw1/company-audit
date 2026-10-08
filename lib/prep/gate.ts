import auditConfig from "@/content/audit.config";
import sealedFile from "@/content/prep.sealed.json";
import { deriveKey, isSealed, isSealedV1, kidOf, type SealedFile } from "./seal";

/**
 * The prep gate, shared by middleware.ts and lib/prep/content.ts. It holds no
 * secret, so the host needs no variables: the lock is the salt and key check
 * in content/prep.sealed.json (both public), and the key arrives with the
 * visitor. ?prep=<PREP_KEY> once derives the decryption key, checks it, and
 * stores it in an httpOnly cookie; after that, the cookie is the key.
 */
export const COOKIE = "audit_prep";

/**
 * The template's fictional example has nothing sealed. Its example prep opens
 * with this public key, so anyone trying the template sees the whole prep view.
 */
export const DEMO_KEY = "demo";
const DEMO_SALT = "Y29tcGFueS1hdWRpdDpkZW1v";

export interface Lock {
  salt: string;
  kid: string;
}

/** The lock for a sealed file: its own, the demo's for the fictional example, or none (nothing to open). */
export async function lockOf(file: SealedFile, fictional: boolean): Promise<Lock | null> {
  if (isSealed(file)) return { salt: file.salt, kid: file.kid };
  if (fictional && file.v === 0) return { salt: DEMO_SALT, kid: (await kidOf(await deriveKey(DEMO_KEY, DEMO_SALT)))! };
  return null;
}

/** The cookie value for a typed key, or null if it isn't the key. */
export async function unlockWith(lock: Lock | null, typed: string): Promise<string | null> {
  if (!lock || !typed.trim()) return null;
  const key = await deriveKey(typed, lock.salt);
  return (await kidOf(key)) === lock.kid ? key : null;
}

/** Whether a cookie value is the key to the lock. */
export async function holdsWith(lock: Lock | null, cookie: string | undefined): Promise<boolean> {
  if (!lock || !cookie) return false;
  return (await kidOf(cookie)) === lock.kid;
}

let lock: Promise<Lock | null> | undefined;

/** This audit's lock, from the sealed file built into the site. */
export function getLock(): Promise<Lock | null> {
  if (!lock) {
    const file = sealedFile as SealedFile;
    if (isSealedV1(file))
      console.warn("content/prep.sealed.json is in the old format, which needed a server secret. Run `npm run prep:seal` and redeploy; the host needs no variables now.");
    lock = lockOf(file, !!(auditConfig.company as { fictional?: boolean }).fictional);
  }
  return lock;
}

export const unlock = async (typed: string) => unlockWith(await getLock(), typed);
export const holds = async (cookie: string | undefined) => holdsWith(await getLock(), cookie);
