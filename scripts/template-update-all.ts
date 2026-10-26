/**
 * npm run template:update-all -- <owner/repo> [<owner/repo> …]
 *
 * Pull the template's improvements into several audits at once: clones each
 * repo into .audits/ (gitignored), runs `npm run template:update` there, and
 * pushes the result on a branch named template-update, ready for a pull
 * request. Needs git access to each repo. Each audit's content is kept as is;
 * template:update only commits when `npm run check` passes.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/env";

const repos = process.argv.slice(2).filter((a) => /^[\w.-]+\/[\w.-]+$/.test(a));
if (!repos.length) {
  console.error("  Usage: npm run template:update-all -- owner/acme-audit owner/globex-audit");
  process.exit(1);
}

const run = (cmd: string, args: string[], cwd: string) => spawnSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const dir = path.join(ROOT, ".audits");
mkdirSync(dir, { recursive: true });
const results: [string, string][] = [];

for (const repo of repos) {
  const dest = path.join(dir, repo.replace("/", "__"));
  console.log(`\n  ${repo}`);
  const clone = existsSync(dest) ? run("git", ["pull", "--ff-only", "--quiet"], dest) : run("git", ["clone", "--quiet", `https://github.com/${repo}.git`, dest], dir);
  if (clone.status !== 0) {
    results.push([repo, `✗ couldn't clone or pull: ${clone.stderr.trim().split("\n").pop()}`]);
    continue;
  }
  run("git", ["checkout", "-q", "-B", "template-update"], dest);
  const install = run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], dest);
  const update = install.status === 0 ? run("npm", ["run", "-s", "template:update"], dest) : install;
  if (update.status !== 0) {
    results.push([repo, `✗ the update needs a hand: ${(update.stdout + update.stderr).trim().split("\n").slice(-2).join(" ")}`]);
    continue;
  }
  if (/already up to date/i.test(update.stdout)) {
    results.push([repo, "· already up to date"]);
    continue;
  }
  const push = run("git", ["push", "-q", "-u", "origin", "template-update"], dest);
  results.push([repo, push.status === 0 ? "✓ updated: pushed branch template-update, open a pull request" : `✗ updated but couldn't push: ${push.stderr.trim().split("\n").pop()}`]);
}

console.log("\n  Summary\n");
for (const [r, s] of results) console.log(`  ${r}: ${s}`);
