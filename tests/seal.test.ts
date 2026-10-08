import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_KEY, holdsWith, lockOf, unlockWith } from "@/lib/prep/gate";
import { isSealed, isSealedV1, newKey, open, seal, unseal, unsealV1, weakKey, type SealedV1 } from "@/lib/prep/seal";

test("sealed prep round-trips with its key", async () => {
  const key = newKey();
  const text = JSON.stringify({ talkTrack: [{ chapter: "overview", say: "Héllo — “quotes” and emoji ✓" }] });
  const sealed = await seal(text, key);
  assert.ok(isSealed(sealed));
  assert.ok(!sealed.data.includes("talkTrack"), "the ciphertext doesn't carry the plain text");
  assert.ok(!JSON.stringify(sealed).includes(key), "the file doesn't carry the key");
  assert.equal(await unseal(sealed, key), text);
});

test("each seal uses a fresh IV", async () => {
  const key = newKey();
  const [a, b] = await Promise.all([seal("same", key), seal("same", key)]);
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.data, b.data);
});

test("re-sealing with the same key keeps the salt, so the unlock cookie stays valid", async () => {
  const key = newKey();
  const first = await seal("draft one", key);
  const second = await seal("draft two", key, first);
  assert.equal(second.salt, first.salt);
  assert.equal(second.kid, first.kid);
  assert.notEqual(second.iv, first.iv);
  const rotated = await seal("draft three", newKey(), second);
  assert.notEqual(rotated.salt, second.salt, "a new key gets a new salt");
  assert.notEqual(rotated.kid, second.kid);
});

test("a wrong key can't open it", async () => {
  const sealed = await seal("private", newKey());
  await assert.rejects(unseal(sealed, newKey()));
});

test("tampering is detected", async () => {
  const key = newKey();
  const sealed = await seal("private notes", key);
  const flipped = sealed.data[0] === "A" ? "B" + sealed.data.slice(1) : "A" + sealed.data.slice(1);
  await assert.rejects(unseal({ ...sealed, data: flipped }, key));
});

test("new keys are strong; weak ones are refused", () => {
  const key = newKey();
  assert.equal(key.length, 24);
  assert.match(key, /^[A-Za-z0-9_-]+$/, "URL-safe, so ?prep=<key> needs no escaping");
  assert.equal(weakKey(key), null);
  assert.match(weakKey("demo") ?? "", /20/);
  assert.match(weakKey("interview2026") ?? "", /20/);
  assert.ok(weakKey("abababababababababababab"), "a long pattern is still weak");
});

test("the gate: the key unlocks, the cookie holds a derived key, nothing else opens it", async () => {
  const key = newKey();
  const file = await seal("private", key);
  const lock = await lockOf(file, false);
  const cookie = await unlockWith(lock, key);
  assert.ok(cookie, "the right key unlocks");
  assert.notEqual(cookie, key, "the cookie never holds PREP_KEY itself");
  assert.equal(await open(file, cookie!), "private", "the cookie is what decrypts");
  assert.equal(await holdsWith(lock, cookie!), true);

  assert.equal(await unlockWith(lock, "not-the-key"), null);
  assert.equal(await unlockWith(lock, ""), null);
  for (const forged of [key, "1", "%%%", newKey() + newKey(), undefined])
    assert.equal(await holdsWith(lock, forged), false, `a forged cookie (${forged}) doesn't open it`);
});

test("nothing sealed: a real audit has no lock, the template's example opens with the demo key", async () => {
  assert.equal(await lockOf({ v: 0 }, false), null);
  assert.equal(await unlockWith(null, DEMO_KEY), null);
  const demo = await lockOf({ v: 0 }, true);
  assert.ok(await unlockWith(demo, DEMO_KEY));
  assert.equal(await unlockWith(demo, "dev"), null);
});

test("an old v1 file: the server can't open it, prep:seal can move it over", async () => {
  // Sealed the way the previous template did: AES-GCM with a 32-byte PREP_SECRET.
  const secret = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aes = await crypto.subtle.importKey("raw", Buffer.from(secret, "base64url"), "AES-GCM", false, ["encrypt"]);
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode("company-audit:prep:v1") }, aes, new TextEncoder().encode("old notes"));
  const v1: SealedV1 = { v: 1, alg: "AES-256-GCM", iv: Buffer.from(iv).toString("base64url"), data: Buffer.from(data).toString("base64url") };

  assert.ok(isSealedV1(v1));
  assert.equal(isSealed(v1), false);
  assert.equal(await lockOf(v1, false), null, "no server secret any more, so no way in");
  assert.equal(await unsealV1(v1, secret), "old notes");
  await assert.rejects(unsealV1(v1, "short"), /32 random bytes/);
});

test("the placeholder isn't sealed", () => {
  assert.equal(isSealed({ v: 0 }), false);
  assert.equal(isSealedV1({ v: 0 }), false);
});
