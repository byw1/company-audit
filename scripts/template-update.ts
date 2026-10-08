/**
 * npm run template:update — pull the template's latest improvements into this
 * audit, keeping everything that's yours: content/, public/logos/ and the
 * generated images. Commits the merge only if `npm run check` passes after it;
 * otherwise it leaves the merge staged and says what failed. Prep sealed in
 * an older format, which needed a secret on the host, is re-sealed in the
 * current one, which needs none.
 *
 * TEMPLATE_REPO overrides the source (default byw1/company-audit).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REPO = process.env.TEMPLATE_REPO ?? "https://github.com/byw1/company-audit.git";
const OURS = ["content", "public/logos", "app/icon.png", "app/apple-icon.png", "app/opengraph-image.png", "app/opengraph-image.alt.txt", "wrangler.jsonc"];

function git(args: string[], opts: { allowFail?: boolean } = {}) {
  const r = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0 && !opts.allowFail) throw new Error(`git ${args.join(" ")}: ${(r.stderr || r.stdout).trim()}`);
  return { ok: r.status === 0, out: (r.stdout ?? "").trim() };
}

function npm(args: string[]) {
  return spawnSync("npm", args, { cwd: ROOT, stdio: "inherit" }).status === 0;
}

function main() {
  if (git(["status", "--porcelain"]).out) throw new Error("Commit or stash your changes first: the update is a merge.");
  if (!git(["remote", "get-url", "template"], { allowFail: true }).ok) {
    git(["remote", "add", "template", REPO]);
    console.log(`  ✓ added remote "template" → ${REPO}`);
  }
  git(["config", "merge.ours.driver", "true"]);
  console.log("  fetching the template…");
  git(["fetch", "--quiet", "template", "main"]);

  const firstTime = !git(["merge-base", "HEAD", "template/main"], { allowFail: true }).ok;
  const merge = git(
    ["merge", "template/main", "--no-commit", "--no-ff", "-X", "theirs", ...(firstTime ? ["--allow-unrelated-histories"] : [])],
    { allowFail: true },
  );
  if (!merge.ok && /Already up to date/i.test(merge.out)) return console.log("  ✓ already up to date with the template");
  // Whatever the merge did, this audit's own files win.
  git(["checkout", "HEAD", "--", ...OURS.filter((p) => git(["ls-files", "--error-unmatch", p], { allowFail: true }).ok || p === "content")], { allowFail: true });
  const unmerged = git(["diff", "--name-only", "--diff-filter=U"]).out;
  if (unmerged) throw new Error(`Conflicts to resolve by hand:\n${unmerged}\nThen \`npm install && npm run check\` and commit.`);

  console.log("  installing and checking…");
  const ok = npm(["install", "--no-audit", "--no-fund"]) && npm(["run", "-s", "check"]);
  if (!ok) {
    console.log("\n  ! The merge is staged but `npm run check` failed: the template may have changed the content schema. `npm run validate` says what to update; commit when it passes.");
    process.exit(1);
  }
  // Prep sealed by an older template needed a secret on the host; the new format needs none. Move it over.
  const sealedFile = path.join(ROOT, "content", "prep.sealed.json");
  if (existsSync(sealedFile) && JSON.parse(readFileSync(sealedFile, "utf8")).v === 1 && !npm(["run", "-s", "prep:seal"]))
    console.log("\n  ! Your sealed prep is in the old format, and moving it needs content/prep.ts (or PREP_SECRET) and PREP_KEY in .env.local. Run `npm run prep:seal` where you have them, before you next deploy.");
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "Pull template improvements"]);
  console.log("  ✓ merged and committed. Run `npm run verify:share` before you next deploy.");
}

try {
  main();
} catch (e) {
  console.error(`  ✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
}
