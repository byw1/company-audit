import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanName } from "@/lib/recipient";

test("personal links: names are cleaned to letters and title case", () => {
  assert.equal(cleanName("jane doe"), "Jane Doe");
  assert.equal(cleanName("mary-jane o'neil"), "Mary-Jane O'neil");
  assert.equal(cleanName("José"), "José");
  assert.equal(cleanName("<script>alert(1)</script>"), "Scriptalertscript", "no markup survives");
  assert.equal(cleanName("a".repeat(80))?.length, 40, "capped");
  assert.equal(cleanName("  "), null);
  assert.equal(cleanName("123"), null);
  assert.equal(cleanName(undefined), null);
});
