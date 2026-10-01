/**
 * npm run prep:init   — start your private prep: copy the example to content/prep.ts
 *                       (gitignored) and put a PREP_KEY and PREP_SECRET in .env.local.
 * npm run prep:seal   — validate content/prep.ts and encrypt it into
 *                       content/prep.sealed.json, the only form that's committed.
 *                       --watch re-seals on every save; --if-present does nothing
 *                       (quietly) when there's no content/prep.ts or no secret.
 * npm run prep:status — is the sealed file current with content/prep.ts?
 * npm run prep:open   — print the decrypted prep (to check a deploy's secret).
 *
 * Runs with --conditions=react-server so `server-only` resolves to a no-op.
 */
import { copyFileSync, existsSync, watch, writeFileSync } from "node:fs";
import path from "node:path";
import { isSealed, newSecret, seal, unseal } from "@/lib/prep/seal";
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
  if (!env.PREP_SECRET) {
    setEnvLocal("PREP_SECRET", newSecret());
    console.log("  ✓ PREP_SECRET generated in .env.local (it decrypts your prep; keep it in your password manager)");
  } else console.log("  · PREP_SECRET already set in .env.local");
  if (!env.PREP_KEY) {
    setEnvLocal("PREP_KEY", newSecret().slice(0, 24));
    console.log("  ✓ PREP_KEY generated in .env.local (visit ?prep=<PREP_KEY> to unlock the prep view)");
  } else console.log("  · PREP_KEY already set in .env.local");
  console.log("\n  Next: write your prep in content/prep.ts, then `npm run prep:seal`.");
  console.log("  Deploying? Set the same PREP_KEY and PREP_SECRET as secrets on your host.");
}

/** Validate content/prep.ts and return its canonical JSON. */
async function plainJson(): Promise<string | null> {
  const plain = await loadPrepPlain();
  if (!plain) return null;
  const { audit } = loadPublic();
  return JSON.stringify(parsePrep(plain.raw, audit));
}

async function sealOnce({ quiet = false } = {}) {
  const secret = envVar("PREP_SECRET");
  const json = await plainJson();
  if (!json) {
    if (has("--if-present")) return;
    throw new Error(`No ${rel(PREP_PLAIN)}. Run \`npm run prep:init\` first.`);
  }
  if (!secret) {
    if (has("--if-present")) return;
    throw new Error("No PREP_SECRET in the environment or .env.local. Run `npm run prep:init`.");
  }
  // Re-sealing changes the IV, so skip it when the content hasn't changed: no noise in git.
  const current = readSealed();
  if (isSealed(current)) {
    try {
      if ((await unseal(current, secret)) === json) {
        if (!quiet) console.log(`  · ${rel(PREP_SEALED)} is already current`);
        return;
      }
    } catch {
      // sealed with another secret: re-seal with this one
    }
  }
  writeFileSync(PREP_SEALED, JSON.stringify(await seal(json, secret), null, 2) + "\n");
  console.log(`  ✓ sealed ${rel(PREP_PLAIN)} → ${rel(PREP_SEALED)} (safe to commit)`);
}

async function status() {
  const secret = envVar("PREP_SECRET");
  const sealed = readSealed();
  const json = await plainJson();
  if (!isSealed(sealed)) return console.log(`  ! nothing sealed yet${json ? ": run `npm run prep:seal`" : ""}`);
  if (!secret) return console.log("  ! no PREP_SECRET here, so the sealed file can't be checked");
  let opened: string;
  try {
    opened = await unseal(sealed, secret);
  } catch {
    process.exitCode = 1;
    return console.log("  ✗ the sealed file doesn't open with this PREP_SECRET");
  }
  if (!json) return console.log(`  ✓ sealed prep opens with this PREP_SECRET (no ${rel(PREP_PLAIN)} here to compare)`);
  if (opened === json) return console.log(`  ✓ ${rel(PREP_SEALED)} is current with ${rel(PREP_PLAIN)}`);
  process.exitCode = 1;
  console.log(`  ✗ ${rel(PREP_SEALED)} is stale: run \`npm run prep:seal\``);
}

async function open() {
  const secret = envVar("PREP_SECRET");
  const sealed = readSealed();
  if (!isSealed(sealed) || !secret) throw new Error("Nothing sealed, or no PREP_SECRET.");
  console.log(JSON.stringify(JSON.parse(await unseal(sealed, secret)), null, 2));
}

async function main() {
  if (cmd === "init") return init();
  if (cmd === "status") return status();
  if (cmd === "open") return open();
  if (cmd !== "seal") throw new Error(`Unknown command "${cmd}" (init, seal, status, open)`);
  await sealOnce();
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
