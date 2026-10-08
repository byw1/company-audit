import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import config from "@/content/audit.config";
import { envVar, ROOT } from "./env";

/** Shared by the deploy scripts: nothing to configure on any host, so all they need is a sound build and a URL. */

/** Refuse to ship prep that's stale, or sealed in the old format a host can't open. */
export function readyToShip() {
  const r = spawnSync("npm", ["run", "-s", "prep:status"], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${(r.stdout + r.stderr).trim().replace(/^\s*✗\s*/, "")}\n    Fix that first, or pass --force.`);
}

/** The key that opens this audit's prep view: yours, or "demo" for the template's own example. */
export function unlockKey(): string | undefined {
  const file = path.join(ROOT, "content", "prep.sealed.json");
  const sealed = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { v: 0 };
  if (sealed.v === 0 && (config.company as { fictional?: boolean }).fictional) return "demo";
  return envVar("PREP_KEY");
}

export function unlockLine(url: string) {
  const key = unlockKey();
  const at = url || "https://<your site>";
  if (!key) return `    Unlock the prep view once at ${at}/?prep=<PREP_KEY>. Send the plain URL.`;
  return `    Your prep view: ${at}/?prep=${encodeURIComponent(key)}\n    That link is yours alone; send the plain URL.`;
}

export function recordDeploy(info: { target: string; url: string } & Record<string, string>) {
  const dir = path.join(ROOT, "content", "generated");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "deploy.json"), JSON.stringify({ ...info, at: new Date().toISOString().slice(0, 10) }, null, 2) + "\n");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const status = (url: string, init?: RequestInit) => fetch(url, { redirect: "manual", ...init }).then((r) => r.status, () => 0);

/**
 * The live site answers, /prep is 404 without the key, and your key opens
 * it, with nothing set on the host. Exits non-zero only if the gate is open.
 */
export async function checkLive(url: string) {
  let home = 0;
  for (let i = 0; i < 30 && home !== 200; i++) {
    home = await status(url);
    if (home !== 200) await sleep(3000); // a new domain can take a minute to route
  }
  if (home !== 200) {
    console.log(`  ! ${url} isn't answering yet (${home || "no response"}). Give it a minute, then \`npm run deployed -- ${url}\` to check again.`);
    return;
  }
  console.log(`  ✓ ${url} answers`);

  const locked = await status(`${url}/prep`);
  if (locked !== 404) {
    console.log(`  ✗ ${url}/prep returned ${locked} without the key; it must be 404. Don't send the link.`);
    process.exitCode = 1;
    return;
  }
  console.log("  ✓ /prep is 404 without the key");

  const key = unlockKey();
  if (!key) return;
  const r = await fetch(`${url}/?prep=${encodeURIComponent(key)}`, { redirect: "manual" }).catch(() => null);
  const cookie = r?.headers.get("set-cookie")?.match(/audit_prep=([^;,]+)/)?.[1];
  const opened = cookie ? await status(`${url}/prep`, { headers: { cookie: `audit_prep=${cookie}` } }) : 0;
  if (opened === 200) console.log("  ✓ your key opens the prep view (and nothing is set on the host)");
  else console.log("  ! your PREP_KEY doesn't open the live prep view yet. If you've just sealed prep or changed the key, commit content/prep.sealed.json and deploy again.");
}
