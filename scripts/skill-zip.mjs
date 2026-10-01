/**
 * npm run skill:zip — package skills/company-audit as dist/company-audit-skill.zip,
 * the file claude.ai asks for under Settings → Capabilities → Skills.
 * (Claude Code needs no zip: copy the folder into ~/.claude/skills/.)
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "dist", "company-audit-skill.zip");
mkdirSync(path.dirname(out), { recursive: true });
rmSync(out, { force: true });
execFileSync("zip", ["-rq", out, "company-audit"], { cwd: path.join(root, "skills"), stdio: "inherit" });
console.log(`  ✓ ${path.relative(root, out)}`);
