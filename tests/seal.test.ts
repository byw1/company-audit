import assert from "node:assert/strict";
import { test } from "node:test";
import { isSealed, newSecret, seal, unseal } from "@/lib/prep/seal";

test("sealed prep round-trips with its secret", async () => {
  const secret = newSecret();
  const text = JSON.stringify({ talkTrack: [{ chapter: "overview", say: "Héllo — “quotes” and emoji ✓" }] });
  const sealed = await seal(text, secret);
  assert.ok(isSealed(sealed));
  assert.ok(!sealed.data.includes("talkTrack"), "the ciphertext doesn't carry the plain text");
  assert.equal(await unseal(sealed, secret), text);
});

test("each seal uses a fresh IV", async () => {
  const secret = newSecret();
  const [a, b] = await Promise.all([seal("same", secret), seal("same", secret)]);
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.data, b.data);
});

test("a wrong secret can't open it", async () => {
  const sealed = await seal("private", newSecret());
  await assert.rejects(unseal(sealed, newSecret()));
});

test("tampering is detected", async () => {
  const secret = newSecret();
  const sealed = await seal("private notes", secret);
  const flipped = sealed.data[0] === "A" ? "B" + sealed.data.slice(1) : "A" + sealed.data.slice(1);
  await assert.rejects(unseal({ ...sealed, data: flipped }, secret));
});

test("secrets must be 32 random bytes", async () => {
  assert.equal(newSecret().length, 43);
  await assert.rejects(seal("x", "short"), /32 random bytes/);
});

test("the placeholder isn't sealed", () => {
  assert.equal(isSealed({ v: 0 }), false);
});
