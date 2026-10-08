/**
 * npm run deployed -- <url>
 *
 * For a deploy made outside the deploy scripts: Railway from GitHub (the
 * dashboard or Claude's Railway connector), a custom domain, anything else.
 * Records the URL so `npm run status` sees it, then checks the live site the
 * same way the deploy scripts do: it answers, /prep is 404 without the key,
 * and your key opens it.
 */
import { checkLive, recordDeploy, unlockLine } from "./lib/deploy";

async function main() {
  const raw = process.argv[2];
  if (!raw || raw.startsWith("-")) throw new Error("Usage: npm run deployed -- https://<your site>");
  const url = (/^https?:\/\//.test(raw) ? raw : `https://${raw}`).replace(/\/+$/, "");
  const host = new URL(url).host;
  const target = host.endsWith(".up.railway.app") ? "railway" : host.endsWith(".workers.dev") ? "cloudflare" : "custom";
  recordDeploy({ target, url });
  console.log(`  ✓ recorded ${url} in content/generated/deploy.json`);
  await checkLive(url);
  console.log(unlockLine(url));
}

main().catch((e) => {
  console.error(`  ✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
