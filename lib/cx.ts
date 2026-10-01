/**
 * Join class names, skipping falsy ones. Client components use this instead of
 * cn(): they never pass conflicting utilities, and cn's merge tables would add
 * ~12 KB to every page's JavaScript. Server components keep cn (no client cost).
 */
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
