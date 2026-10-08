/**
 * npm run prep:init   — start your private prep: copy the example to content/prep.ts
 *                       (gitignored) and put a PREP_KEY in .env.local.
 * npm run prep:seal   — validate content/prep.ts and encrypt it with PREP_KEY into
 *                       content/prep.sealed.json, the only form that's committed.
 *                       --watch re-seals on every save; --if-present does nothing
 *                       (quietly) when there's no content/prep.ts or no key;
 *                       --link prints the local unlock link (npm run dev uses it).
 * npm run prep:status — is the sealed file current with content/prep.ts?
 * npm run prep:open   — print the decrypted prep.
 *
 * PREP_KEY is the only key: the site and its host never hold it, so a deploy
 * needs no variables. A file sealed by an older template (v1, with
 * PREP_SECRET) is moved to the new format by the next `prep:seal`.
 *
 * Runs with --conditions=react-server so `server-only` resolves to a no-op.
 */
import { copyFileSync, existsSync, watch, writeFileSync } from "node:fs";
import path from "node:path";
import { isSealed, isSealedV1, newKey, seal, unseal, unsealV1, weakKey } from "@/lib/prep/seal";
import { parsePrep } from "@/lib/schema/prep";
import { AuditContentError } from "@/lib/schema/validate";
import { loadPrepPlain, loadPublic, PREP_EXAMPLE, PREP_PLAIN, PREP_SEALED, readSealed } from "./lib/audit";
import { envVar, readEnvLocal, ROOT, setEnvLocal } from "./lib/env";

const rel = (p: string) => path.relative(ROOT, p);
const [cmd = "seal", ...flags] = process.argv.slice(2);
const has = (f: string) => flags.includes(f);

async function init() {
  if (existsSync(PREP_PLAIN)) console.log(`  · ${rel(PREP_PLAIN)} already exists; left as is`);
  else {
    copyFileSync(PREP_EXAMPLE, PREP_PLAIN);
    console.log(`  ✓ ${rel(PREP_PLAIN)} created from the example (gitignored: it never leaves this machine)`);
  }
  const env = readEnvLocal();
  if (!env.PREP_KEY) {
    setEnvLocal("PREP_KEY", newKey());
    console.log("  ✓ PREP_KEY generated in .env.local");
  } else if (weakKey(env.PREP_KEY)) {
    console.log(`  ! PREP_KEY in .env.local is too weak (${weakKey(env.PREP_KEY)}). Delete that line and run \`npm run prep:init\` again.`);
  } else console.log("  · PREP_KEY already set in .env.local");
  console.log("    It's the only key to your prep: the site and its host never hold it. Save it in");
  console.log("    your password manager. Without it, nobody can open the sealed prep, you included.");
  console.log("\n  Next: write your prep in content/prep.ts, then `npm run prep:seal`.");
  console.log("  Deploying needs no variables: you bring the key, as ?prep=<PREP_KEY>.");
}

/** Validate prep and return its canonical JSON. */
function canonical(raw: unknown): string {
  return JSON.stringify(parsePrep(raw, loadPublic().audit));
}

async function plainJson(): Promise<string | null> {
  const plain = await loadPrepPlain();
  return plain ? canonical(plain.raw) : null;
}

/** PREP_KEY, refused if it's too weak to protect a real audit's file in a public repo. */
function prepKey(): string | undefined {
  const key = envVar("PREP_KEY");
  const weak = key && weakKey(key);
  if (weak && !loadPublic().audit.config.company.fictional)
    throw new Error(`PREP_KEY is too weak to protect a file anyone can download: ${weak}. Delete it from .env.local and run \`npm run prep:init\` for a strong one.`);
  return key;
}

async function sealOnce({ quiet = false } = {}) {
  const key = prepKey();
  const current = readSealed();
  let json = await plainJson();
  let from = rel(PREP_PLAIN);
  // An older template's file and no content/prep.ts here: open it with its PREP_SECRET and move it over.
  const secret = envVar("PREP_SECRET");
  if (!json && isSealedV1(current) && secret && key) {
    json = canonical(JSON.parse(await unsealV1(current, secret)));
    from = "the old-format file";
  }
  if (!json) {
    if (has("--if-present")) return;
    throw new Error(`No ${rel(PREP_PLAIN)}. Run \`npm run prep:init\` first.`);
  }
  if (!key) {
    if (has("--if-present")) return;
    throw new Error("No PREP_KEY in the environment or .env.local. Run `npm run prep:init`.");
  }
  // Re-sealing changes the IV, so skip it when the content hasn't changed: no noise in git.
  if (isSealed(current)) {
    try {
      if ((await unseal(current, key)) === json) {
        if (!quiet) console.log(`  · ${rel(PREP_SEALED)} is already current`);
        return;
      }
    } catch {
      // sealed with another key: re-seal with this one
    }
  }
  writeFileSync(PREP_SEALED, JSON.stringify(await seal(json, key, current), null, 2) + "\n");
  console.log(`  ✓ sealed ${from} → ${rel(PREP_SEALED)} (safe to commit)`);
  if (isSealedV1(current))
    console.log("  ✓ moved to the new format: the host needs no PREP_KEY or PREP_SECRET now, so you can delete both there");
}

/** The local link that unlocks the prep view, for `npm run dev`. */
async function link() {
  const sealed = readSealed();
  const key = envVar("PREP_KEY");
  let k: string | null = null;
  if (isSealed(sealed) && key) k = await unseal(sealed, key).then(() => key, () => null);
  else if (sealed.v === 0 && loadPublic().audit.config.company.fictional) k = "demo";
  if (k) console.log(`  prep view: http://localhost:3000/?prep=${encodeURIComponent(k)}  (?prep=off to lock it again)`);
}

async function status() {
  const key = envVar("PREP_KEY");
  const sealed = readSealed();
  const json = await plainJson();
  if (isSealedV1(sealed)) {
    process.exitCode = 1;
    return console.log("  ✗ the sealed file is in the old format, which needed a server secret: run `npm run prep:seal`");
  }
  if (!isSealed(sealed)) return console.log(`  ! nothing sealed yet${json ? ": run `npm run prep:seal`" : ""}`);
  if (!key) return console.log("  ! no PREP_KEY here, so the sealed file can't be checked");
  let opened: string;
  try {
    opened = await unseal(sealed, key);
  } catch {
    process.exitCode = 1;
    return console.log("  ✗ the sealed file doesn't open with this PREP_KEY: run `npm run prep:seal`");
  }
  if (!json) return console.log(`  ✓ sealed prep opens with this PREP_KEY (no ${rel(PREP_PLAIN)} here to compare)`);
  if (opened === json) return console.log(`  ✓ ${rel(PREP_SEALED)} is current with ${rel(PREP_PLAIN)}`);
  process.exitCode = 1;
  console.log(`  ✗ ${rel(PREP_SEALED)} is stale: run \`npm run prep:seal\``);
}

async function open() {
  const key = envVar("PREP_KEY");
  const sealed = readSealed();
  if (!isSealed(sealed) || !key) throw new Error("Nothing sealed, or no PREP_KEY.");
  console.log(JSON.stringify(JSON.parse(await unseal(sealed, key)), null, 2));
}

async function main() {
  if (cmd === "init") return init();
  if (cmd === "status") return status();
  if (cmd === "open") return open();
  if (cmd !== "seal") throw new Error(`Unknown command "${cmd}" (init, seal, status, open)`);
  await sealOnce();
  if (has("--link")) await link();
  if (!has("--watch")) return;
  console.log(`  watching ${rel(PREP_PLAIN)}…`);
  let t: NodeJS.Timeout | undefined;
  watch(PREP_PLAIN, () => {
    clearTimeout(t);
    t = setTimeout(() => {
      sealOnce({ quiet: true }).catch((e) => console.error(e instanceof AuditContentError ? e.message : e));
    }, 150);
  });
}

main().catch((e) => {
  console.error(e instanceof AuditContentError ? e.message : `  ✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
