/**
 * npm run deploy:cf [-- --github] [-- --force]
 *
 * Builds for Cloudflare Workers, deploys, and sets PREP_KEY and PREP_SECRET as
 * the Worker's secrets from .env.local, so one command takes a finished audit
 * live. --github also stores PREP_SECRET as a GitHub Actions secret (via the
 * gh CLI), so CI checks your real prep. Records the URL in
 * content/generated/deploy.json for `npm run status`.
 *
 * Needs Cloudflare credentials once: `npx wrangler login`, or
 * CLOUDFLARE_API_TOKEN (+ CLOUDFLARE_ACCOUNT_ID) in the environment.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import config from "@/content/audit.config";
import { workerName } from "./lib/config";
import { readEnvLocal } from "./lib/env";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const bin = (name: string) => path.join(ROOT, "node_modules", ".bin", name);

function run(cmd: string, a: string[], opts: { capture?: boolean; input?: string } = {}) {
  const r = spawnSync(cmd, a, { cwd: ROOT, encoding: "utf8", stdio: opts.capture ? ["pipe", "pipe", "inherit"] : "inherit", input: opts.input });
  if (r.status !== 0) throw new Error(`${path.basename(cmd)} ${a.join(" ")} failed`);
  return r.stdout ?? "";
}

async function main() {
  const name = workerName();
  if (!config.company.fictional && name === "company-audit")
    throw new Error('wrangler.jsonc still names the Worker "company-audit". `npm run new` names it for you; or set "name" and the WORKER_SELF_REFERENCE service yourself.');
  const env = readEnvLocal();
  const key = process.env.PREP_KEY || env.PREP_KEY;
  const secret = process.env.PREP_SECRET || env.PREP_SECRET;
  if (!key || !secret) throw new Error("No PREP_KEY / PREP_SECRET in .env.local. Run `npm run prep:init`.");

  // Don't ship stale prep or an unchecked site, unless asked to.
  if (!args.includes("--force")) {
    const status = spawnSync("npm", ["run", "-s", "prep:status"], { cwd: ROOT, encoding: "utf8" });
    if (status.status !== 0) throw new Error("The sealed prep isn't current. Run `npm run prep:seal` first (or pass --force).");
  }

  const who = spawnSync(bin("wrangler"), ["whoami"], { cwd: ROOT, encoding: "utf8" });
  if (who.status !== 0 || /not authenticated/i.test(who.stdout + who.stderr))
    throw new Error("Not signed in to Cloudflare. Run `npx wrangler login` (or set CLOUDFLARE_API_TOKEN), then try again.");

  console.log(`  building and deploying the Worker "${name}"…`);
  run(bin("opennextjs-cloudflare"), ["build"]);
  const out = run(bin("opennextjs-cloudflare"), ["deploy"], { capture: true });
  process.stdout.write(out);
  const url = out.match(/https:\/\/[^\s]+\.workers\.dev/)?.[0] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // Secrets: bulk-set from a temp file that's removed straight after.
  const dir = mkdtempSync(path.join(os.tmpdir(), "audit-secrets-"));
  const file = path.join(dir, "secrets.json");
  try {
    writeFileSync(file, JSON.stringify({ PREP_KEY: key, PREP_SECRET: secret }), { mode: 0o600 });
    run(bin("wrangler"), ["secret", "bulk", file]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  console.log("  ✓ PREP_KEY and PREP_SECRET set as the Worker's secrets");

  if (args.includes("--github")) {
    try {
      execFileSync("gh", ["secret", "set", "PREP_SECRET"], { cwd: ROOT, input: secret, stdio: ["pipe", "inherit", "inherit"] });
      console.log("  ✓ PREP_SECRET stored as a GitHub Actions secret (CI now checks your real prep)");
    } catch {
      console.warn("  ! Couldn't set the GitHub secret (is gh installed and signed in?). Add PREP_SECRET under Settings → Secrets → Actions.");
    }
  }

  writeFileSync(path.join(ROOT, "content", "generated", "deploy.json"), JSON.stringify({ target: "cloudflare", worker: name, url, at: new Date().toISOString().slice(0, 10) }, null, 2) + "\n");
  console.log(`\n  ✓ live${url ? ` at ${url}` : ""}`);
  console.log("    Unlock the prep view once with ?prep=<PREP_KEY> (in .env.local). Send the plain URL.");
}

main().catch((e) => {
  console.error(`  ✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
