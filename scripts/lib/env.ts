import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/** Scripts run outside Next, so they read .env.local themselves. Real env vars win. */
export const ROOT = process.cwd();
export const ENV_LOCAL = path.join(ROOT, ".env.local");

export function readEnvLocal(): Record<string, string> {
  if (!existsSync(ENV_LOCAL)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(ENV_LOCAL, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
}

export function envVar(name: string): string | undefined {
  return process.env[name] || readEnvLocal()[name] || undefined;
}

/** Set a variable in .env.local, keeping everything else in the file. */
export function setEnvLocal(name: string, value: string) {
  const lines = existsSync(ENV_LOCAL) ? readFileSync(ENV_LOCAL, "utf8").split(/\r?\n/) : [];
  const i = lines.findIndex((l) => l.match(new RegExp(`^\\s*${name}\\s*=`)));
  if (i >= 0) lines[i] = `${name}=${value}`;
  else lines.splice(lines.length && lines[lines.length - 1] === "" ? lines.length - 1 : lines.length, 0, `${name}=${value}`);
  writeFileSync(ENV_LOCAL, lines.join("\n").replace(/\n*$/, "\n"));
}
