import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Author } from "./profile";

const CONFIG = path.join(process.cwd(), "content", "audit.config.ts");
const q = (s: string) => JSON.stringify(s);

/** Replace the author block in audit.config.ts, keeping the rest of the file as written. */
export function setConfigAuthor(a: Author) {
  const src = readFileSync(CONFIG, "utf8");
  const block = /( {2}author:\s*\{)[\s\S]*?\n {2}\},/;
  if (!block.test(src)) throw new Error("Couldn't find the author block in content/audit.config.ts");
  writeFileSync(CONFIG, src.replace(block, `  author: {\n    name: ${q(a.name)},\n    email: ${q(a.email)},\n    linkedin: ${q(a.linkedin)},\n  },`));
}

export interface NewConfig {
  company: string;
  domain: string;
  role: string;
  team?: string;
  location?: string;
  jdUrl: string;
  researched: string; // YYYY-MM
  hero: "shader" | "particles" | "flywheel";
  author: Author;
}

/** A fresh audit.config.ts for a real company. */
export function writeConfig(c: NewConfig) {
  const lines = [
    `import type { ConfigInput } from "@/lib/schema/public";`,
    ``,
    `/** ${c.company}, read through the ${c.role} role. Everything company-specific lives in content/. */`,
    `export default {`,
    `  company: {`,
    `    name: ${q(c.company)},`,
    `    domain: ${q(c.domain)},`,
    `    // iconDomain: "invest.example.com", // if ${c.domain} has no icon (npm run logos says so)`,
    `    fictional: false,`,
    `  },`,
    `  role: {`,
    `    title: ${q(c.role)},`,
    ...(c.team ? [`    team: ${q(c.team)},`] : []),
    ...(c.location ? [`    location: ${q(c.location)},`] : []),
    `    jdUrl: ${q(c.jdUrl)},`,
    `    jdSource: "jd",`,
    `  },`,
    `  author: {`,
    `    // You: shown in the header ("An outside-in read of {Company}, by {name}") and footer.`,
    `    name: ${q(c.author.name)},`,
    `    email: ${q(c.author.email)},`,
    `    linkedin: ${q(c.author.linkedin)},`,
    `  },`,
    `  researched: ${q(c.researched)},`,
    `  // accent: "#2f5bea", // optional: overrides the colour derived from the company's icon`,
    `  hero: {`,
    `    variant: ${q(c.hero)},`,
    ...(c.hero === "flywheel" ? [`    orbits: ["Supply", "Demand", "Platform"], // three names that mean something for this business`] : []),
    `  },`,
    `  modules: {`,
    `    company: true,`,
    `    workflows: true,`,
    `    record: true,`,
    `    competitors: true,`,
    `    ideas: true,`,
    `    sources: true,`,
    `    fit: false,`,
    `  },`,
    `} satisfies ConfigInput;`,
    ``,
  ];
  writeFileSync(CONFIG, lines.join("\n"));
}

/** Point wrangler.jsonc (name and the self-reference service) at this audit's Worker. */
export function setWorkerName(name: string) {
  const file = path.join(process.cwd(), "wrangler.jsonc");
  const src = readFileSync(file, "utf8");
  writeFileSync(file, src.replace(/("name":\s*)"[^"]*"/, `$1${q(name)}`).replace(/("service":\s*)"[^"]*"/, `$1${q(name)}`));
}

export function workerName(): string {
  const src = readFileSync(path.join(process.cwd(), "wrangler.jsonc"), "utf8");
  return src.match(/"name":\s*"([^"]+)"/)?.[1] ?? "";
}
