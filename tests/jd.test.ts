import assert from "node:assert/strict";
import { test } from "node:test";
import { htmlToText, jdMarkdown, tidy } from "../scripts/lib/jd";

test("posting HTML becomes readable text", () => {
  const text = htmlToText("<h2>What you&#39;ll own</h2><ul><li>Own the P&amp;L</li><li>Lead the team</li></ul><p>Base&nbsp;pay</p>");
  assert.match(text, /## What you'll own/);
  assert.match(text, /- Own the P&L\n- Lead the team/);
  assert.match(text, /Base pay/);
});

test("tidy normalises whitespace only", () => {
  assert.equal(tidy("a b  \n\n\n\nc"), "a b\n\nc");
});

test("jd.md records where the role was checked", () => {
  const md = jdMarkdown({ url: "https://x/1", board: "ashby", title: "Head of Ops", onIndex: true, indexUrl: "https://x", text: "Body" }, "Acme", "2026-10-01");
  assert.match(md, /^# Head of Ops: Acme/);
  assert.match(md, /Seen on the careers index:\*\* https:\/\/x/);
  const closed = jdMarkdown({ url: "https://x/1", board: "ashby", title: "T", onIndex: false, indexUrl: "https://x", text: "B" }, "Acme", "2026-10-01");
  assert.match(closed, /NOT on the careers index/);
});
