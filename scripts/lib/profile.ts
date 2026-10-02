import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Your author profile, kept outside any one audit so every new site starts
 * with it: ~/.config/company-audit/ (or $COMPANY_AUDIT_HOME).
 *   author.json  name, email, LinkedIn: the byline
 *   author.md    your guardrails and where your evidence lives
 */
export const PROFILE_DIR = process.env.COMPANY_AUDIT_HOME ?? path.join(os.homedir(), ".config", "company-audit");
const JSON_FILE = path.join(PROFILE_DIR, "author.json");
const MD_FILE = path.join(PROFILE_DIR, "author.md");

export interface Author {
  name: string;
  email: string;
  linkedin: string;
}

export function readProfile(): { author: Author; md: string } | null {
  if (!existsSync(JSON_FILE) || !existsSync(MD_FILE)) return null;
  return { author: JSON.parse(readFileSync(JSON_FILE, "utf8")), md: readFileSync(MD_FILE, "utf8") };
}

export function writeProfile(author: Author, md: string) {
  mkdirSync(PROFILE_DIR, { recursive: true });
  writeFileSync(JSON_FILE, JSON.stringify(author, null, 2) + "\n");
  writeFileSync(MD_FILE, md);
}

/** author.md still has the template's placeholder comments. */
export const isPlaceholderAuthorMd = (md: string) => md.includes("<!--");
export const isPlaceholderAuthor = (a: Author) => /example/i.test(`${a.name} ${a.email} ${a.linkedin}`);
