/**
 * npm run deploy:cf [-- --force]
 *
 * Builds for Cloudflare Workers and deploys. There is nothing to configure:
 * the sealed prep ships in the build, and only you hold the key that opens
 * it. Records the URL in content/generated/deploy.json for `npm run status`,
 * then checks the live site: it answers, /prep is 404 without the key, and
 * your key opens it.
 *
 * Needs Cloudflare credentials once: `npx wrangler login`, or
 * CLOUDFLARE_API_TOKEN (+ CLOUDFLARE_ACCOUNT_ID) in the environment.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import config from "@/content/audit.config";
import { workerName } from "./lib/config";
import { checkLive, readyToShip, recordDeploy, unlockLine } from "./lib/deploy";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const bin = (name: string) => path.join(ROOT, "node_modules", ".bin", name);

function run(cmd: string, a: string[], opts: { capture?: boolean } = {}) {
  const r = spawnSync(cmd, a, { cwd: ROOT, encoding: "utf8", stdio: opts.capture ? ["inherit", "pipe", "inherit"] : "inherit" });
  if (r.status !== 0) throw new Error(`${path.basename(cmd)} ${a.join(" ")} failed`);
  return r.stdout ?? "";
}

async function main() {
  const name = workerName();
  if (!config.company.fictional && name === "company-audit")
    throw new Error('wrangler.jsonc still names the Worker "company-audit". `npm run new` names it for you; or set "name" and the WORKER_SELF_REFERENCE service yourself.');
  if (!args.includes("--force")) readyToShip();

  const who = spawnSync(bin("wrangler"), ["whoami"], { cwd: ROOT, encoding: "utf8" });
  if (who.status !== 0 || /not authenticated/i.test(who.stdout + who.stderr))
    throw new Error("Not signed in to Cloudflare. Run `npx wrangler login` (or set CLOUDFLARE_API_TOKEN), then try again.");

  console.log(`  building and deploying the Worker "${name}"…`);
  run(bin("opennextjs-cloudflare"), ["build"]);
  const out = run(bin("opennextjs-cloudflare"), ["deploy"], { capture: true });
  process.stdout.write(out);
  const url = out.match(/https:\/\/[^\s]+\.workers\.dev/)?.[0] ?? "";

  recordDeploy({ target: "cloudflare", worker: name, url });
  console.log(`\n  ✓ live${url ? ` at ${url}` : ""}`);
  if (url) await checkLive(url);
  console.log(unlockLine(url));
}

main().catch((e) => {
  console.error(`  ✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
