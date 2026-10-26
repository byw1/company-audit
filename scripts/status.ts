/**
 * npm run status — where this audit is, and the one thing to do next.
 *
 * A checklist from setup to deploy, worked out from the files themselves, so
 * any session (yours, or Claude's next one) can pick up where the last left
 * off. --json prints the same for scripts and skills.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isSealed, isSealedV1, unseal, weakKey } from "@/lib/prep/seal";
import { loadPrepPlain, loadPublic, rawPublic, readSealed, PREP_EXAMPLE } from "./lib/audit";
import { envVar, readEnvLocal } from "./lib/env";
import { brandFingerprint, contentFingerprint } from "./lib/fingerprint";
import { exampleLeftovers } from "./lib/leftovers";
import { isPlaceholderAuthor, isPlaceholderAuthorMd } from "./lib/profile";

const ROOT = process.cwd();
const read = (p: string) => (existsSync(path.join(ROOT, p)) ? readFileSync(path.join(ROOT, p), "utf8") : null);

interface Step {
  id: string;
  label: string;
  done: boolean;
  /** Not blocking, but worth saying. */
  warn?: string;
  detail?: string;
  next: string;
}

async function steps(): Promise<Step[]> {
  const { config, competitors, workflows } = rawPublic;
  const out: Step[] = [];
  const add = (s: Step) => out.push(s);

  add({
    id: "setup",
    label: "Started for a real company and role",
    done: !config.company.fictional,
    detail: config.company.fictional ? "still the template's fictional example" : `${config.company.name} · ${config.role.title}`,
    next: 'npm run new -- --company "<Company>" --domain <domain> --jd <posting URL>',
  });

  const md = read("content/author.md") ?? "";
  add({
    id: "author",
    label: "Your byline and rules (content/author.md)",
    done: !isPlaceholderAuthor(config.author) && !!md && !isPlaceholderAuthorMd(md),
    detail: isPlaceholderAuthor(config.author) ? "audit.config.ts → author is the example" : isPlaceholderAuthorMd(md) ? "author.md still has placeholder comments" : config.author.name,
    next: "Fill in content/author.md and audit.config.ts → author, then `npm run author:save` so every future audit starts with them",
  });

  const env = readEnvLocal();
  // A fresh checkout of an audit whose prep is already sealed needs that key back, not a new one.
  const sealedAlready = isSealed(readSealed());
  add({
    id: "key",
    label: "Prep key in .env.local (PREP_KEY, yours alone)",
    done: !!env.PREP_KEY && !weakKey(env.PREP_KEY) && existsSync(path.join(ROOT, "content", "prep.ts")),
    detail: env.PREP_KEY && weakKey(env.PREP_KEY) ? `too weak: ${weakKey(env.PREP_KEY)}` : sealedAlready && !env.PREP_KEY ? "prep is sealed; this checkout needs its key" : undefined,
    next: sealedAlready ? "Ask the author for this audit's PREP_KEY, then `npm run prep:init -- --key <PREP_KEY>` (restores content/prep.ts)" : "npm run prep:init",
  });

  const jd = read("content/jd.md") ?? "";
  const jdOk = !!jd && !/FICTIONAL EXAMPLE/.test(jd);
  add({
    id: "jd",
    label: "Job posting saved verbatim (content/jd.md)",
    done: jdOk && /Seen on the careers index/.test(jd),
    detail: !jdOk ? "still the example" : /NOT on the careers index/.test(jd) ? "the role wasn't on the careers index" : /Seen on the careers index/.test(jd) ? undefined : "careers index not recorded",
    next: "npm run jd -- <posting URL> --save (and record the careers index URL if the board isn't Ashby, Greenhouse or Lever)",
  });

  const left = exampleLeftovers();
  const research: [string, string, string][] = [
    ["company", "content/company.ts", "step 2"],
    ["role", "content/role.ts", "step 2"],
    ["record", "content/public-record.ts", "step 3"],
    ["competitors", "content/competitors.ts", "step 4"],
    ["workflows", "content/workflows.ts", "step 5"],
    ["ideas", "content/ideas.ts", "step 6"],
    ["sources", "content/sources.ts", "every step"],
  ];
  for (const [id, file, step] of research) {
    const hits = left[file] ?? [];
    const s: Step = {
      id,
      label: `Research: ${file.replace("content/", "")}`,
      done: hits.length === 0,
      detail: hits.length ? `still has the example (${hits.slice(0, 2).join(", ")})` : undefined,
      next: `Replace the fictional example in ${file} (/new-audit, ${step})`,
    };
    if (id === "competitors" && s.done && (competitors.field.length < 4 || competitors.field.length > 8)) s.warn = `${competitors.field.length} competitors; the playbook asks for four to eight`;
    if (id === "workflows" && s.done && (workflows.length < 4 || workflows.length > 7)) s.warn = `${workflows.length} workflows; the playbook suggests four to seven`;
    add(s);
  }

  const v = spawnSync("npm", ["run", "-s", "validate"], { cwd: ROOT, encoding: "utf8" });
  const problems = (v.stdout + v.stderr).match(/failed validation \((\d+) problem/)?.[1];
  const warnings = (v.stdout + v.stderr).match(/(\d+) warnings?:/)?.[1];
  add({
    id: "validate",
    label: "Content validates",
    done: v.status === 0,
    detail: v.status === 0 ? (warnings ? `${warnings} warning(s)` : undefined) : `${problems ?? "some"} problem(s)`,
    next: "npm run validate, and fix what it lists",
  });

  const plain = await loadPrepPlain();
  const example = existsSync(PREP_EXAMPLE) ? (await import(pathToFileURL(PREP_EXAMPLE).href)).default : null;
  const prepIsExample = !!plain && !!example && JSON.stringify(plain.raw) === JSON.stringify(example);
  add({
    id: "prep",
    label: "Prep written (content/prep.ts)",
    done: !!plain && !prepIsExample,
    detail: !plain ? "no content/prep.ts" : prepIsExample ? "still the example" : undefined,
    next: "Write content/prep.ts from your own evidence (/new-audit, step 7)",
  });

  const sealed = readSealed();
  const key = envVar("PREP_KEY");
  let sealedCurrent = false;
  if (isSealed(sealed) && key && plain) {
    try {
      const { parsePrep } = await import("@/lib/schema/prep");
      const { loadPublic } = await import("./lib/audit");
      sealedCurrent = (await unseal(sealed, key)) === JSON.stringify(parsePrep(plain.raw, loadPublic().audit));
    } catch {
      sealedCurrent = false;
    }
  }
  add({
    id: "sealed",
    label: "Prep sealed and current (content/prep.sealed.json)",
    done: sealedCurrent,
    detail: isSealedV1(sealed) ? "the old format, which needed a server secret" : undefined,
    next: "npm run prep:seal",
  });

  const brand = read("content/generated/brand.json");
  const brandOk = !!brand && JSON.parse(brand).inputs === brandFingerprint(config);
  add({
    id: "logos",
    label: "Logos, accent and preview images current",
    done: brandOk,
    detail: brandOk ? undefined : "the company, role, author or logos changed since they were drawn",
    next: "npm run logos (commit the output)",
  });

  add({
    id: "factcheck",
    label: "Fact-check pass recorded (content/factcheck.md)",
    done: !!read("content/factcheck.md"),
    next: "/fact-check: run the fact-checker and fix every BLOCKER and FIX",
  });

  const pass = read(".verify/last-pass.json");
  const passed = pass ? JSON.parse(pass) : null;
  // Only a run that opened your own prep counts: CI checks the gate without the key.
  const fullPass = !!passed && passed.full !== false && !String(passed.prep).includes("example");
  const passOk = fullPass && passed.content === contentFingerprint();
  add({
    id: "verify",
    label: "verify:share passed on this content",
    done: passOk,
    detail: passed && !passOk ? (fullPass ? `last pass ${passed.at.slice(0, 10)}, content changed since` : "the last pass couldn't open your prep") : undefined,
    next: "npm run verify:share",
  });

  const deploy = read("content/generated/deploy.json");
  add({
    id: "deploy",
    label: "Deployed",
    done: !!deploy,
    detail: deploy ? JSON.parse(deploy).url : undefined,
    next: "npm run deploy:railway (or deploy:cf for Cloudflare). No variables to set",
  });

  return out;
}

interface Quality {
  facts: { sourced: number; inferred: number; illustrative: number };
  sources: number;
  oldestDays: number | null;
  competitors: number;
  record: number;
  ideas: number;
  flags: string[];
}

/** How solid the content is, in numbers, so a thin audit is obvious before it ships. */
function quality(): Quality | null {
  let audit;
  try {
    audit = loadPublic().audit;
  } catch {
    return null; // validate reports why
  }
  const facts = { sourced: 0, inferred: 0, illustrative: 0 };
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object") {
      const o = n as Record<string, unknown>;
      if (typeof o.basis === "string" && o.basis in facts) facts[o.basis as keyof typeof facts]++;
      Object.values(o).forEach(walk);
    }
  };
  walk([audit.company, audit.role, audit.workflows, audit.record, audit.competitors, audit.ideas]);
  const ages = audit.sources.items.map((s) => Math.floor((Date.now() - Date.parse(s.accessed)) / 86_400_000));
  const q: Quality = {
    facts,
    sources: audit.sources.items.length,
    oldestDays: ages.length ? Math.max(...ages) : null,
    competitors: audit.competitors.field.length,
    record: audit.record.items.length,
    ideas: audit.ideas.items.length,
    flags: [],
  };
  const total = facts.sourced + facts.inferred + facts.illustrative;
  if (total && facts.sourced / total < 0.4) q.flags.push(`only ${Math.round((100 * facts.sourced) / total)}% of claims are sourced; find sources for the strongest reads`);
  if (q.oldestDays !== null && q.oldestDays > 45) q.flags.push(`the oldest source was read ${q.oldestDays} days ago; \`npm run refresh\``);
  if (q.sources < 10) q.flags.push(`${q.sources} sources is thin; aim for 15 or more`);
  if (q.record < 5) q.flags.push(`${q.record} public-record items; aim for five or more`);
  const pdf = read("content/generated/pdf.json");
  if (pdf && JSON.parse(pdf).file && JSON.parse(pdf).content !== contentFingerprint()) q.flags.push("public/audit.pdf is older than the content; `npm run pdf`");
  return q;
}

function qualityLines(q: Quality | null) {
  if (!q) return ["Quality: content doesn't validate yet."];
  const { sourced, inferred, illustrative } = q.facts;
  return [
    `Quality: ${sourced} sourced · ${inferred} outside-in reads · ${illustrative} illustrative · ${q.sources} sources (oldest ${q.oldestDays ?? "–"} days) · ${q.competitors} competitors · ${q.record} record items · ${q.ideas} ideas`,
    ...q.flags.map((f) => `! ${f}`),
  ];
}

async function main() {
  const list = await steps();
  const next = list.find((s) => !s.done);
  const q = quality();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ steps: list, next: next ?? null, quality: q }, null, 2));
    return;
  }
  const { config } = rawPublic;
  console.log(`\n  ${config.company.name} · ${config.role.title}\n`);
  list.forEach((s, i) => {
    const mark = s.done ? (s.warn ? "!" : "✓") : "·";
    const note = [s.detail, s.warn].filter(Boolean).join("; ");
    console.log(`  ${mark} ${String(i + 1).padStart(2)}. ${s.label}${note ? `  (${note})` : ""}`);
  });
  const done = list.filter((s) => s.done).length;
  console.log(`\n  ${qualityLines(q).join("\n  ")}`);
  console.log(`\n  ${done}/${list.length} done.${next ? `\n  Next: ${next.next}` : " Ready to send."}\n`);

  // --save: the same, as PROGRESS.md, committed after each step so a session
  // that ends early can be picked up from any device.
  if (process.argv.includes("--save")) {
    const md = [
      `# Progress: ${config.company.name} · ${config.role.title}`,
      "",
      `Updated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC by \`npm run status -- --save\`. ${done}/${list.length} done.`,
      "",
      ...list.map((s) => `- [${s.done ? "x" : " "}] ${s.label}${s.detail ? ` (${s.detail})` : ""}`),
      "",
      ...qualityLines(q).map((l) => (l.startsWith("!") ? `- ${l.slice(2)}` : l)),
      "",
      next ? `**Next:** ${next.next}` : "**Ready to send.**",
      "",
      "To carry on in a new session: open this repo in Claude Code and say `Carry on`.",
      "",
    ].join("\n");
    writeFileSync(path.join(ROOT, "PROGRESS.md"), md);
    console.log("  ✓ PROGRESS.md saved (commit it)\n");
  }
}

void main();
