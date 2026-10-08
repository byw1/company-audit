/**
 * npm run deploy:railway [-- --force] [-- --new]
 *
 * Deploys this folder to Railway and gives it a public URL. No variables and
 * no config file: Railway builds with `npm run build`, serves with
 * `npm start`, and the sealed prep ships in the build, opened only by the key
 * you hold.
 *
 * The first run signs you in (a browser opens, or a link and code on a
 * headless machine), creates a Railway project named after the audit, and
 * links this folder; later runs redeploy it. It uploads what git would
 * commit, so content/prep.ts and .env.local stay on this machine. Uses
 * `railway` if it's installed, otherwise `npx @railway/cli`. Then it checks
 * the live site: it answers, /prep is 404 without the key, and your key
 * opens it.
 *
 * Rather redeploy on every push? Railway → New Project → Deploy from GitHub
 * repo, then Settings → Networking → Generate Domain, and record the URL with
 * `npm run deployed -- <url>`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { workerName } from "./lib/config";
import { checkLive, readyToShip, recordDeploy, unlockLine } from "./lib/deploy";
import { ROOT } from "./lib/env";

const args = process.argv.slice(2);
const DEPLOYED = path.join(ROOT, "content", "generated", "deploy.json");
const CLI = spawnSync("railway", ["--version"], { encoding: "utf8" }).status === 0 ? ["railway"] : ["npx", "-y", "@railway/cli@5"];

function railway(a: string[], opts: { capture?: boolean } = {}) {
  const [cmd, ...pre] = CLI;
  const r = spawnSync(cmd, [...pre, ...a], { cwd: ROOT, encoding: "utf8", stdio: opts.capture ? ["inherit", "pipe", "pipe"] : "inherit" });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}\n${r.stderr ?? ""}` };
}

/** Hostnames in the CLI's output: Railway's own *.up.railway.app, and any custom domain in its JSON. */
function domains(out: string): string[] {
  const hosts = new Set<string>();
  for (const m of out.matchAll(/\b((?:[a-z0-9-]+\.)+up\.railway\.app)\b/gi)) hosts.add(m[1].toLowerCase());
  for (const m of out.matchAll(/"domain"\s*:\s*"([^"]+)"/g)) hosts.add(m[1].replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase());
  return [...hosts];
}

async function main() {
  if (!args.includes("--force")) readyToShip();
  const name = workerName();
  const linked = railway(["status", "--json"], { capture: true }).ok;
  // Already on Railway (from GitHub, say) but this folder isn't linked: don't make a second project.
  const previous = existsSync(DEPLOYED) ? JSON.parse(readFileSync(DEPLOYED, "utf8")) : null;
  if (!linked && previous?.target === "railway" && !args.includes("--new"))
    throw new Error(`This audit is already on Railway at ${previous.url}. If it deploys from GitHub, just push. To deploy from here, run \`railway link\` and pick its project first, or pass --new for a separate one.`);
  const fresh = !linked || args.includes("--new");
  console.log(fresh ? `  first deploy: Railway signs you in if needed, then creates the project "${name}"…` : "  deploying to the linked Railway service…");
  if (!railway(fresh ? ["up", "-y", "--new", "--name", name] : ["up"]).ok) throw new Error("The Railway deploy didn't succeed (its log is above). Fix that and run this again.");

  // Railway doesn't make a service public on its own: give it a domain, once.
  let hosts = domains(railway(["domain", "list", "--json"], { capture: true }).out);
  if (!hosts.length) hosts = domains(railway(["domain", "--json"], { capture: true }).out);
  const host = hosts.find((h) => !h.endsWith(".up.railway.app")) ?? hosts[0];
  if (!host) throw new Error("Deployed, but the domain couldn't be read. In Railway: the service → Settings → Networking → Generate Domain; then `npm run deployed -- <url>`.");
  const url = `https://${host}`;

  recordDeploy({ target: "railway", project: name, url });
  console.log(`\n  ✓ live at ${url}`);
  await checkLive(url);
  console.log(unlockLine(url));
}

main().catch((e) => {
  console.error(`  ✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
