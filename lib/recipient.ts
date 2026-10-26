/**
 * Personal links: ?for=jane greets the recipient by name and attributes the
 * visit in the host's logs. The name is whatever the sender put in the link,
 * so it's cleaned to letters, spaces, hyphens and apostrophes, and capped.
 */
export const FOR_COOKIE = "audit_for";

export function cleanName(raw: string | null | undefined): string | null {
  const s = (raw ?? "").replace(/[^\p{L}' -]/gu, "").replace(/\s+/g, " ").trim().slice(0, 40);
  if (!s) return null;
  return s.replace(/(^|[\s-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());
}
