/**
 * Sealed prep: content/prep.ts never leaves your machine. `npm run prep:seal`
 * encrypts it into content/prep.sealed.json, which is safe to commit to a
 * public repo, with a key derived from PREP_KEY. Only you hold PREP_KEY: the
 * host never sees it and needs no variables. Visiting ?prep=<PREP_KEY> once
 * derives the decryption key, checks it against the file, and leaves it in an
 * httpOnly cookie, so the visitor brings the key with each request and the
 * server keeps none of its own (see lib/prep/gate.ts).
 *
 * AES-256-GCM, with the key derived from PREP_KEY by HKDF-SHA256 and a salt
 * kept in the file, all through Web Crypto, so the same code runs in Node
 * (scripts, `next start`) and on Cloudflare Workers. PREP_KEY is random
 * (`npm run prep:init` makes one), so a fast derivation is enough: there's no
 * password to guess, and a weak key is refused before anything is sealed.
 */

export interface Sealed {
  v: 2;
  alg: "AES-256-GCM";
  kdf: "HKDF-SHA256";
  /** base64url, 16 bytes. Kept across re-seals with the same PREP_KEY, so editing prep doesn't sign you out. */
  salt: string;
  /** base64url SHA-256 of the derived key: the server checks a key against it without decrypting anything */
  kid: string;
  /** base64url, 12 bytes */
  iv: string;
  /** base64url ciphertext with the GCM tag appended */
  data: string;
}

/** Sealed by an older template with PREP_SECRET, a key the host had to hold. `npm run prep:seal` moves it to v2. */
export interface SealedV1 {
  v: 1;
  alg: "AES-256-GCM";
  iv: string;
  data: string;
}

/** An empty placeholder: the audit has no prep sealed yet. */
export interface Unsealed {
  v: 0;
}

export type SealedFile = Sealed | SealedV1 | Unsealed;

const INFO = new TextEncoder().encode("company-audit:prep:v2");
const AAD_V1 = new TextEncoder().encode("company-audit:prep:v1");

function toB64url(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** A derived key's 32 bytes, or null for anything that isn't one (a forged or stale cookie). */
function keyBytes(key: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]{43}$/.test(key)) return null;
  const raw = fromB64url(key);
  return raw.length === 32 ? raw : null;
}

async function aesKey(key: string) {
  const raw = keyBytes(key);
  if (!raw) throw new Error("Not a derived prep key");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** A new PREP_KEY: 18 random bytes, 24 characters, URL-safe. */
export function newKey() {
  return toB64url(crypto.getRandomValues(new Uint8Array(18)));
}

/**
 * Why a PREP_KEY is too weak to protect a file anyone can download, or null
 * if it's fine. Catches the accidents (a word, a short phrase, a pattern);
 * `npm run prep:init` makes keys that always pass.
 */
export function weakKey(prepKey: string): string | null {
  const k = prepKey.trim();
  if (k.length < 20) return `it's ${k.length} characters; it needs at least 20`;
  if (new Set(k).size < 12) return "it repeats too few characters to be random";
  return null;
}

/** The AES key for a PREP_KEY and salt, base64url: what the prep cookie holds. */
export async function deriveKey(prepKey: string, salt: string): Promise<string> {
  const ikm = await crypto.subtle.importKey("raw", new TextEncoder().encode(prepKey.trim()), "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: fromB64url(salt), info: INFO }, ikm, 256);
  return toB64url(new Uint8Array(bits));
}

/** The public check value for a derived key; null if the value isn't a derived key at all. */
export async function kidOf(key: string): Promise<string | null> {
  const raw = keyBytes(key);
  return raw ? toB64url(new Uint8Array(await crypto.subtle.digest("SHA-256", raw))) : null;
}

/**
 * Encrypt with PREP_KEY. Pass the current file to keep its salt when the key
 * is unchanged: the derived key (and so the cookie) stays the same and only
 * the IV is new. A different key gets a fresh salt.
 */
export async function seal(plaintext: string, prepKey: string, previous?: SealedFile): Promise<Sealed> {
  let salt = previous && isSealed(previous) ? previous.salt : null;
  let key = salt ? await deriveKey(prepKey, salt) : null;
  if (!salt || !key || (await kidOf(key)) !== (previous as Sealed).kid) {
    salt = toB64url(crypto.getRandomValues(new Uint8Array(16)));
    key = await deriveKey(prepKey, salt);
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: INFO }, await aesKey(key), new TextEncoder().encode(plaintext));
  return { v: 2, alg: "AES-256-GCM", kdf: "HKDF-SHA256", salt, kid: (await kidOf(key))!, iv: toB64url(iv), data: toB64url(new Uint8Array(data)) };
}

/** Decrypt with a derived key (the cookie's value). Throws if it's wrong or the file was tampered with. */
export async function open(file: Sealed, key: string): Promise<string> {
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64url(file.iv), additionalData: INFO }, await aesKey(key), fromB64url(file.data));
  return new TextDecoder().decode(plain);
}

/** Decrypt with PREP_KEY itself. Throws if it's wrong or the file was tampered with. */
export async function unseal(file: Sealed, prepKey: string): Promise<string> {
  return open(file, await deriveKey(prepKey, file.salt));
}

/** Decrypt a v1 file with the PREP_SECRET it was sealed with, to move it to v2 (scripts only). */
export async function unsealV1(file: SealedV1, secret: string): Promise<string> {
  let raw: Uint8Array;
  try {
    raw = fromB64url(secret.trim());
  } catch {
    raw = new Uint8Array(0);
  }
  if (raw.length !== 32) throw new Error("PREP_SECRET must be 32 random bytes, base64url");
  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64url(file.iv), additionalData: AAD_V1 }, key, fromB64url(file.data));
  return new TextDecoder().decode(plain);
}

export function isSealed(file: unknown): file is Sealed {
  const f = file as Partial<Sealed> | null;
  return !!f && f.v === 2 && typeof f.salt === "string" && typeof f.kid === "string" && typeof f.iv === "string" && typeof f.data === "string";
}

export function isSealedV1(file: unknown): file is SealedV1 {
  const f = file as Partial<SealedV1> | null;
  return !!f && f.v === 1 && typeof f.iv === "string" && typeof f.data === "string";
}
