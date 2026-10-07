import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { CONTENT_FILES, exampleLeftovers } from "../scripts/lib/leftovers";

/** A throwaway content/ folder with the same text in every research file. */
function fixture(text: string) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "audit-"));
  mkdirSync(path.join(dir, "content"));
  for (const f of CONTENT_FILES) writeFileSync(path.join(dir, f), text);
  return dir;
}

test("traces of the fictional example are found in every research file", () => {
  const left = exampleLeftovers(fixture('sourced("Makers onboarded", "nw-about"); domain: "northwind.example"'));
  for (const f of CONTENT_FILES) assert.deepEqual(left[f], ["an nw- source id", "a .example domain"], f);
});

test("a real audit's files come back clean", () => {
  assert.deepEqual(exampleLeftovers(fixture('sourced("Revenue", "acme-10k"); domain: "acme.com"')), {});
});
