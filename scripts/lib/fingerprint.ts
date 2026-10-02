import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const sha = (s: string | Buffer) => createHash("sha256").update(s).digest("hex").slice(0, 16);

function files(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).sort()) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) files(p, out);
    else out.push(p);
  }
  return out;
}

/**
 * Everything the built site depends on in content/: the public content, the
 * sealed prep and the generated logos/theme. Not the plain prep (it ships
 * only through the sealed file) and not the status markers themselves.
 */
export function contentFingerprint() {
  const skip = /content\/(prep\.ts|factcheck\.md|generated\/(brand|deploy)\.json)$/;
  const list = files(path.join(ROOT, "content")).filter((f) => !skip.test(f));
  return sha(list.map((f) => `${path.relative(ROOT, f)}\n${readFileSync(f, "utf8")}`).join("\n\u0000"));
}

/** What the favicon and link preview are drawn from (see scripts/brand.tsx). */
export function brandFingerprint(c: {
  company: { name: string; domain: string; iconDomain?: string; fictional?: boolean };
  role: { title: string };
  author: { name: string };
  researched: string;
}) {
  const theme = existsSync(path.join(ROOT, "content/generated/theme.json")) ? readFileSync(path.join(ROOT, "content/generated/theme.json"), "utf8") : "";
  const logos = existsSync(path.join(ROOT, "content/generated/logos.json")) ? JSON.parse(readFileSync(path.join(ROOT, "content/generated/logos.json"), "utf8")) : { entries: {} };
  const e = logos.entries[(c.company.iconDomain ?? c.company.domain).toLowerCase().replace(/^www\./, "")];
  const logo = e?.src180 && existsSync(path.join(ROOT, "public", e.src180)) ? sha(readFileSync(path.join(ROOT, "public", e.src180))) : "monogram";
  return sha(JSON.stringify([c.company.name, c.company.fictional, c.role.title, c.author.name, c.researched, theme, logo]));
}
