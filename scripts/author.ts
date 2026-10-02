/**
 * npm run author:save   save this audit's byline (audit.config.ts → author) and
 *                       content/author.md as your profile, for every future audit
 * npm run author:load   copy your profile into this audit
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import config from "@/content/audit.config";
import { setConfigAuthor } from "./lib/config";
import { isPlaceholderAuthor, isPlaceholderAuthorMd, PROFILE_DIR, readProfile, writeProfile } from "./lib/profile";

const ROOT = process.cwd();
const MD = path.join(ROOT, "content", "author.md");

function main() {
  const cmd = process.argv[2];
  if (cmd === "save") {
    const md = readFileSync(MD, "utf8");
    if (isPlaceholderAuthor(config.author)) throw new Error("audit.config.ts → author is still the example. Set your name, email and LinkedIn first.");
    if (isPlaceholderAuthorMd(md)) console.warn("  ! content/author.md still has placeholder comments; saving it anyway");
    writeProfile(config.author, md);
    console.log(`  ✓ saved your profile to ${PROFILE_DIR}`);
  } else if (cmd === "load") {
    const p = readProfile();
    if (!p) throw new Error(`No profile in ${PROFILE_DIR}. Fill in this audit's author, then run \`npm run author:save\`.`);
    setConfigAuthor(p.author);
    writeFileSync(MD, p.md);
    console.log(`  ✓ loaded ${p.author.name}'s profile into content/author.md and audit.config.ts`);
  } else throw new Error("Usage: npm run author:save | npm run author:load");
}

try {
  main();
} catch (e) {
  console.error(`  ✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
}
