/**
 * npm run preflight — before a build starts, check everything it will need,
 * so a missing permission shows up in the first minute rather than after the
 * research. Exits non-zero if something would stop the build.
 *
 * Checks: dependencies, push access to this repo, open web access (company
 * sites, job boards, the favicon service), and a browser for verify:share.
 * The Railway connector is one of Claude's tools, not something a script can
 * see: Claude checks that itself (CLAUDE.md → Start here).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/env";

let blockers = 0;
const ok = (m: string) => console.log(`  ✓ ${m}`);
const warn = (m: string) => console.log(`  ! ${m}`);
const fail = (m: string) => {
  blockers++;
  console.log(`  ✗ ${m}`);
};
const git = (a: string[]) => spawnSync("git", a, { cwd: ROOT, encoding: "utf8" });

async function reach(url: string) {
  try {
    const r = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(12000), headers: { "user-agent": "company-audit preflight" } });
    return r.status;
  } catch {
    return 0;
  }
}

async function main() {
  console.log("preflight — can this session build and ship an audit?\n");

  if (existsSync(path.join(ROOT, "node_modules", ".bin", "next"))) ok("dependencies installed");
  else fail("dependencies missing: run `npm install`");

  const origin = git(["remote", "get-url", "origin"]).stdout.trim();
  if (!origin) fail("no git remote: this folder isn't a GitHub repo yet");
  else if (/byw1\/company-audit(\.git)?$/.test(origin)) fail("this is the template itself: make a copy with Use this template and open that instead");
  else {
    const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim();
    const push = git(["push", "--dry-run", "origin", `HEAD:refs/heads/${branch}`]);
    if (push.status === 0) ok(`can push to ${origin.replace(/^.*github\.com[/:]/, "").replace(/\.git$/, "")} (${branch})`);
    else fail(`can't push to this repo: ${(push.stderr || push.stdout).trim().split("\n").pop()}. Give Claude's GitHub app access to it.`);
  }

  const sites: [string, string][] = [
    ["the open web", "https://en.wikipedia.org/wiki/Main_Page"],
    ["job board APIs", "https://api.lever.co/v0/postings/lever?mode=json&limit=1"],
    ["the favicon service (logos)", "https://twenty-icons.com/github.com"],
    ["SEC EDGAR", "https://www.sec.gov/files/company_tickers.json"],
  ];
  const results = await Promise.all(sites.map(async ([label, url]) => [label, await reach(url)] as const));
  for (const [label, status] of results) {
    if (status && status < 500) ok(`reaches ${label}`);
    else if (label === "the open web") fail(`can't reach ${label}: the research needs it. Set the environment's network access to allow the open web.`);
    else warn(`can't reach ${label} (${status || "no response"}); the build works around it, with less`);
  }

  const chromium = ["/opt/pw-browsers/chromium", process.env.CHROMIUM_PATH].find((p) => p && existsSync(p));
  let browser = !!chromium;
  if (!browser) {
    try {
      const { chromium: c } = await import("playwright-core");
      browser = existsSync(c.executablePath());
    } catch {}
  }
  if (browser) ok("a browser for verify:share's rendered-DOM check");
  else warn("no Chromium: verify:share skips its rendered-DOM check (`npx playwright-core install chromium` fixes it)");

  console.log(blockers ? `\n✗ ${blockers} thing(s) would stop the build. Fix them first.` : "\n✓ ready to build.");
  if (blockers) process.exitCode = 1;
}

void main();
