/**
 * npm run ship [-- --check] — how far shipping got, and the next step.
 *
 * Shipping is several steps across git, GitHub and Railway, and a session can
 * stop between any two. This works out where it stands from the repo itself,
 * so the next session (or the same one, after a failure) picks up at the
 * right step instead of starting over. --check also tests the live site.
 *
 * Steps: committed → pushed → merged into main → deployed → recorded on main.
 * Opening and merging the pull request and the Railway deploy are Claude's
 * (GitHub and Railway connectors); this says which one is next.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { checkLive } from "./lib/deploy";
import { ROOT } from "./lib/env";

const git = (a: string[]) => {
  const r = spawnSync("git", a, { cwd: ROOT, encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout ?? "").trim() };
};

async function main() {
  git(["fetch", "--quiet", "origin"]);
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]).out;
  const deployFile = path.join(ROOT, "content", "generated", "deploy.json");
  const deploy = existsSync(deployFile) ? (JSON.parse(readFileSync(deployFile, "utf8")) as { url?: string; target?: string }) : null;

  const steps: { label: string; done: boolean; next: string }[] = [
    { label: "Everything committed", done: !git(["status", "--porcelain"]).out, next: "Commit the work: `git add -A && git commit`." },
    {
      label: `Pushed (${branch})`,
      done: git(["rev-parse", "HEAD"]).out === git(["rev-parse", `origin/${branch}`]).out,
      next: `Push: \`git push -u origin ${branch}\`.`,
    },
    {
      label: "Merged into main",
      done: git(["merge-base", "--is-ancestor", "HEAD", "origin/main"]).ok,
      next: "Open a pull request into main and merge it, once CI is green.",
    },
    {
      label: "Deployed",
      done: !!deploy?.url,
      next: "Deploy main: Railway connector create-project → create-deployment (this repo, main) → generate-domain; then `npm run deployed -- <url>`. Without the connector: README → Deploy → Railway.",
    },
    {
      label: "Deploy recorded on main",
      done: git(["cat-file", "-e", "origin/main:content/generated/deploy.json"]).ok,
      next: "Commit content/generated/deploy.json and get it onto main the same way (a small pull request).",
    },
  ];

  console.log("\n  Shipping\n");
  for (const s of steps) console.log(`  ${s.done ? "✓" : "·"} ${s.label}`);
  const next = steps.find((s) => !s.done);
  console.log(next ? `\n  Next: ${next.next}\n` : `\n  ✓ shipped${deploy?.url ? `: ${deploy.url}` : ""}\n`);
  if (process.argv.includes("--check") && deploy?.url) await checkLive(deploy.url);
}

void main();
