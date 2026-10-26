/**
 * npm run note [-- --for <name>] — draft the short message that goes with the
 * link: an email and a LinkedIn note, built from the site's own thesis, so it
 * says only what the site says. Writes research/note.md; nothing is sent.
 *
 * --for <name> addresses it to one person and uses their own link
 * (?for=<name>), so the site greets them and its logs show the visit.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cleanName } from "@/lib/recipient";
import { loadPublic } from "./lib/audit";
import { ROOT } from "./lib/env";

const args = process.argv.slice(2);
const forName = cleanName(args.includes("--for") ? args[args.indexOf("--for") + 1] : undefined) ?? undefined;

function main() {
  const { audit } = loadPublic();
  const deployFile = path.join(ROOT, "content", "generated", "deploy.json");
  const base = existsSync(deployFile) ? (JSON.parse(readFileSync(deployFile, "utf8")) as { url?: string }).url : undefined;
  const url = base ? `${base}${forName ? `/?for=${encodeURIComponent(forName.toLowerCase())}` : ""}` : "<site link>";
  const { company, role, author } = audit.config;
  const hi = forName ? `Hi ${forName},` : "Hi,";
  const points = audit.company.thesis.points.map((p) => p.title);

  const email = [
    `Subject: ${company.name}, ${role.title}: an outside-in read`,
    "",
    hi,
    "",
    `Ahead of our conversation about the ${role.title} role, I put together a short read of ${company.name} from the outside: how the business works, how the work in the role flows, and what I'd do first.`,
    "",
    `The short version, ${audit.company.thesis.headline.replace(/\.$/, "").toLowerCase()}:`,
    ...points.map((p) => `- ${p}`),
    "",
    `It's here: ${url}`,
    "",
    "Every claim is labelled as sourced, my read from the outside, or an illustrative model, so it's easy to see where I'd want to be corrected.",
    "",
    "Best,",
    author.name,
  ].join("\n");

  const linkedin = `${hi} ahead of our chat about the ${role.title} role, I wrote up an outside-in read of ${company.name}: how the business works, the workflows the role owns, and what I'd do first. ${url}`;

  const md = [
    `# The note to send with the link`,
    "",
    "Drafted from the site's thesis by `npm run note`. Edit freely; nothing has been sent.",
    "",
    "## Email",
    "",
    "```text",
    email,
    "```",
    "",
    `## LinkedIn (${linkedin.length} characters; connection notes allow 300)`,
    "",
    "```text",
    linkedin,
    "```",
    "",
  ].join("\n");
  mkdirSync(path.join(ROOT, "research"), { recursive: true });
  writeFileSync(path.join(ROOT, "research", "note.md"), md);
  console.log(`${email}\n\n---\n\n${linkedin}\n\n  ✓ saved research/note.md`);
  if (!base) console.log("  ! not deployed yet, so the link is a placeholder");
}

main();
