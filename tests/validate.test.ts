import assert from "node:assert/strict";
import { test } from "node:test";
import { AuditContentError, parsePublic } from "@/lib/schema/validate";
import { rawPublic } from "../scripts/lib/audit";

const clone = () => structuredClone(rawPublic) as unknown as typeof rawPublic;
const errorsOf = (raw: unknown) => {
  try {
    parsePublic(raw as Record<string, unknown>);
    return [];
  } catch (e) {
    if (e instanceof AuditContentError) return e.issues.filter((i) => i.level === "error").map((i) => i.message);
    throw e;
  }
};

// These run against whatever content this repo holds (the template's example,
// or an audit's own), breaking one thing at a time.

test("an unknown source id fails", () => {
  const raw = clone();
  (raw.company as { oneLiner: unknown }).oneLiner = { basis: "sourced", text: "Makes things.", sources: ["no-such-source"] };
  const errs = errorsOf(raw);
  assert.ok(errs.some((m) => /Unknown source "no-such-source"/.test(m)), errs.join("\n"));
});

test("an unlabelled figure in a plain-text field fails", () => {
  const raw = clone();
  raw.workflows[0].name = "Grow revenue 40%";
  assert.ok(errorsOf(raw).length > 0);
});

test("an idea that traces to nothing fails", () => {
  const raw = clone();
  raw.ideas.items[0].traces = ["leak:no-such-workflow/no-such-leak"];
  assert.ok(errorsOf(raw).length > 0);
});

test("a workflow with no JD line fails", () => {
  const raw = clone();
  raw.workflows[0].jd = ["not-a-responsibility"];
  assert.ok(errorsOf(raw).length > 0);
});

test("a source read in the future fails", () => {
  const raw = clone();
  raw.sources.items[0].accessed = "2999-01-01";
  assert.ok(errorsOf(raw).some((m) => /future/.test(m)));
});
