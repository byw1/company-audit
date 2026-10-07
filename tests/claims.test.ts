import assert from "node:assert/strict";
import { test } from "node:test";
import { model, quote, read, sourced, stat } from "@/lib/claims";
import { findFigure, Plain } from "@/lib/schema/primitives";

test("figures are caught in every common form", () => {
  for (const s of ["$412M in revenue", "up 43%", "a 3x jump", "12,000 makers", "2 million experts", "€5bn", "41 percent"]) assert.ok(findFigure(s), s);
});

test("years, quarters and small counts are fine in plain text", () => {
  for (const s of ["Founded in 2017", "Q3 review", "The first 90 days", "Five workflows", "Series B", "GMV Max"]) assert.equal(findFigure(s), null, s);
});

test("plain-text fields reject a figure", () => {
  assert.equal(Plain.safeParse("Win the Shop tab").success, true);
  assert.equal(Plain.safeParse("Revenue up 40%").success, false);
});

test("claim helpers label what they make", () => {
  assert.deepEqual(sourced("x", "a"), { basis: "sourced", text: "x", sources: ["a"] });
  assert.equal(quote("x", ["a"], { speaker: "CEO" }).quote, true);
  assert.equal(read("x").basis, "inferred");
  assert.equal(model("x").basis, "illustrative");
  assert.equal(stat("$1M", sourced("x", "a")).value, "$1M");
});
