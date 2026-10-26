/**
 * npm run pdf — the whole site as one PDF, for people who won't click a link.
 *
 * Builds (skip with --no-build), starts the site, prints every chapter and
 * workflow in the share view with the print styles, and merges them into
 * public/audit.pdf, which the site then offers from its "Save as PDF"
 * button. It's printed without the prep cookie, so it holds only what any
 * visitor sees. Commit it; `npm run status` flags it when content has
 * changed since.
 */
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { CHAPTERS } from "@/lib/chapters";
import { loadPublic } from "./lib/audit";
import { ROOT } from "./lib/env";
import { contentFingerprint } from "./lib/fingerprint";

const port = () =>
  new Promise<number>((resolve, reject) => {
    const s = createServer();
    s.listen(0, () => {
      const p = (s.address() as { port: number }).port;
      s.close(() => resolve(p));
    });
    s.on("error", reject);
  });

async function main() {
  const { audit } = loadPublic();
  const fingerprint = contentFingerprint();
  const next = path.join(ROOT, "node_modules", ".bin", "next");
  if (!process.argv.includes("--no-build")) {
    console.log("  building…");
    execFileSync(next, ["build"], { cwd: ROOT, stdio: "ignore", env: { ...process.env, NODE_ENV: "production" } });
  }
  const p = await port();
  const base = `http://127.0.0.1:${p}`;
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^PREP_/.test(k)));
  const server = spawn(next, ["start", "-p", String(p), "-H", "127.0.0.1"], { cwd: ROOT, env: { ...env, NODE_ENV: "production" }, stdio: "ignore" });
  try {
    for (let i = 0; i < 150; i++) {
      if (await fetch(base).then((r) => r.ok, () => false)) break;
      await new Promise((r) => setTimeout(r, 400));
    }
    const on = audit.config.modules as Record<string, boolean>;
    const routes = CHAPTERS.filter((c) => c.id === "overview" || on[c.id]).flatMap((c) =>
      c.id === "workflows" ? [c.href, ...audit.workflows.map((w) => `/workflows/${w.id}`)] : [c.href],
    );

    const { chromium } = await import("playwright-core");
    const exe = ["/opt/pw-browsers/chromium", process.env.CHROMIUM_PATH].find((x) => x && existsSync(x));
    const browser = await chromium.launch(exe ? { executablePath: exe } : {});
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.emulateMedia({ media: "print", colorScheme: "light" });
    const merged = await PDFDocument.create();
    merged.setTitle(`${audit.config.company.name}: an outside-in read`);
    merged.setAuthor(audit.config.author.name);
    for (const r of routes) {
      await page.goto(base + r, { waitUntil: "networkidle" });
      const one = await PDFDocument.load(await page.pdf({ format: "Letter", printBackground: true, margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" } }));
      for (const pg of await merged.copyPages(one, one.getPageIndices())) merged.addPage(pg);
      console.log(`  ✓ ${r}`);
    }
    await browser.close();
    writeFileSync(path.join(ROOT, "public", "audit.pdf"), await merged.save());
    mkdirSync(path.join(ROOT, "content", "generated"), { recursive: true });
    writeFileSync(path.join(ROOT, "content", "generated", "pdf.json"), JSON.stringify({ file: "/audit.pdf", content: fingerprint, pages: merged.getPageCount() }, null, 2) + "\n");
    console.log(`  ✓ public/audit.pdf: ${merged.getPageCount()} pages from ${routes.length} routes (commit it with content/generated/pdf.json)`);
  } finally {
    server.kill();
  }
}

main().catch((e) => {
  console.error(`  ✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
