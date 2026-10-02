/**
 * npm run new -- --company "Acme" --domain acme.com --jd <posting URL>
 *                [--role "Head of Ops"] [--slug acme] [--hero shader|particles|flywheel] [--force]
 *
 * Turns a fresh copy of the template into the start of a real audit:
 *   1. fetches the posting, checks it's still on the careers index, and saves
 *      it verbatim to content/jd.md (Ashby, Greenhouse and Lever automatically);
 *   2. writes content/audit.config.ts for the company and role;
 *   3. adds the posting to content/sources.ts as source "jd";
 *   4. loads your author profile (npm run author:save, once) into
 *      content/author.md and the byline;
 *   5. names the Cloudflare Worker <slug>-audit;
 *   6. creates content/prep.ts and the secrets in .env.local (prep:init).
 * The rest of content/ is still the fictional example until the research
 * replaces it; `npm run status` tracks what's left.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import config from "@/content/audit.config";
import { setWorkerName, writeConfig } from "./lib/config";
import { fetchPosting, jdMarkdown } from "./lib/jd";
import { readProfile } from "./lib/profile";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const today = new Date().toISOString().slice(0, 10);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function main() {
  const company = opt("company");
  const domain = opt("domain")?.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const jdUrl = opt("jd");
  if (!company || !domain || !jdUrl) throw new Error('Usage: npm run new -- --company "Acme" --domain acme.com --jd <posting URL> [--role "Title"] [--slug acme] [--hero shader]');
  if (!config.company.fictional && !args.includes("--force"))
    throw new Error(`This repo is already an audit of ${config.company.name}. Start from a fresh copy of the template, or pass --force.`);
  const hero = (opt("hero") ?? "shader") as "shader" | "particles" | "flywheel";
  if (!["shader", "particles", "flywheel"].includes(hero)) throw new Error("--hero must be shader, particles or flywheel");
  const slug = slugify(opt("slug") ?? company);

  // 1. The posting.
  console.log(`  fetching ${jdUrl}…`);
  const posting = await fetchPosting(jdUrl);
  const role = opt("role") ?? posting.title.replace(/\s+[-|–]\s+.*$/, "").trim();
  if (!role) throw new Error("Couldn't read the role title from the posting. Pass --role.");
  if (posting.onIndex === false) console.warn(`  ! The role is NOT on the careers index (${posting.indexUrl}). It may be closed: check before going further.`);
  else if (posting.onIndex === null) console.warn("  ! This board isn't one the template can check automatically. Find the role on the company's careers index and note the URL in content/jd.md.");
  else console.log(`  ✓ "${role}" is listed on the careers index`);
  if (posting.text) {
    writeFileSync(path.join(ROOT, "content", "jd.md"), jdMarkdown({ ...posting, title: role }, company, today));
    console.log("  ✓ content/jd.md saved verbatim");
  } else console.warn("  ! No posting text found: paste the job description into content/jd.md yourself");

  // 2. The config, with your profile's byline.
  const profile = readProfile();
  writeConfig({
    company,
    domain,
    role,
    team: posting.team,
    location: posting.location,
    jdUrl,
    researched: today.slice(0, 7),
    hero,
    author: profile?.author ?? config.author,
  });
  console.log("  ✓ content/audit.config.ts");

  // 3. The posting as source "jd".
  const sourcesFile = path.join(ROOT, "content", "sources.ts");
  const sources = readFileSync(sourcesFile, "utf8");
  if (!/id:\s*"jd"/.test(sources)) {
    const entry = [
      `    {`,
      `      id: "jd",`,
      `      title: ${JSON.stringify(`${role} (job posting)`)},`,
      `      publisher: ${JSON.stringify(`${company} careers`)},`,
      `      url: ${JSON.stringify(jdUrl)},`,
      `      kind: "job-posting",`,
      ...(posting.published ? [`      published: "${posting.published}",`] : []),
      `      accessed: "${today}",`,
      `      group: ${JSON.stringify(company)},`,
      `      note: ${JSON.stringify(posting.onIndex ? `Confirmed live on the careers index (${posting.indexUrl}), not just at its direct URL.` : "Check the careers index and say so here.")},`,
      `    },`,
    ].join("\n");
    writeFileSync(sourcesFile, sources.replace(/items:\s*\[\n/, (m) => `${m}${entry}\n`));
    console.log('  ✓ content/sources.ts: the posting added as source "jd"');
  }

  // 4. Your profile.
  if (profile) {
    writeFileSync(path.join(ROOT, "content", "author.md"), profile.md);
    console.log(`  ✓ content/author.md and the byline from your profile (${profile.author.name})`);
  } else console.warn("  ! No author profile yet: fill in content/author.md and audit.config.ts → author, then `npm run author:save` so the next audit starts with them");

  // 5. The Worker's name.
  setWorkerName(`${slug}-audit`);
  console.log(`  ✓ wrangler.jsonc: Worker "${slug}-audit"`);

  // 6. Private prep and secrets.
  execFileSync("npm", ["run", "-s", "prep:init"], { cwd: ROOT, stdio: "inherit" });

  console.log(`\n  Started: ${company}, ${role}. The rest of content/ is still the fictional example.`);
  console.log("  Next: `npm run status` for the checklist, and /new-audit (or the company-audit skill) for the research.");
}

main().catch((e) => {
  console.error(`  ✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
