import { NextResponse, type NextRequest } from "next/server";
import auditConfig from "@/content/audit.config";

/**
 * Two views. The public one is the default, so a forwarded link can never
 * expose prep notes. The prep view needs PREP_KEY: visit any page with
 * ?prep=<key> once and a cookie remembers it; ?prep=off forgets it. Inside the
 * prep view, ?share previews exactly what a recipient sees.
 *
 * The decision is made here, on the server, and passed down as a request
 * header, so prep-only content is never rendered or serialized for anyone
 * else — not hidden with CSS, not present in the page payload at all.
 */
const COOKIE = "audit_prep";
const SIXTY_DAYS = 60 * 60 * 24 * 60;

function prepKey() {
  if (process.env.PREP_KEY) return process.env.PREP_KEY;
  // Local development only: no key configured means ?prep=dev works.
  return process.env.NODE_ENV === "development" ? "dev" : null;
}

/** The cookie holds a digest of the key, never the key itself. */
async function digest(key: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`audit-prep:${key}`));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req: NextRequest) {
  const key = prepKey();
  const url = req.nextUrl;
  const asked = url.searchParams.get("prep");

  if (asked !== null) {
    const clean = url.clone();
    clean.searchParams.delete("prep");
    const res = NextResponse.redirect(clean);
    if (key && asked === key) {
      res.cookies.set(COOKIE, await digest(key), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: SIXTY_DAYS,
        path: "/",
      });
    } else {
      res.cookies.delete(COOKIE);
    }
    return res;
  }

  const cookie = req.cookies.get(COOKIE)?.value;
  const prepAllowed = !!key && !!cookie && cookie === (await digest(key));
  const view = prepAllowed && !url.searchParams.has("share") ? "prep" : "share";

  // A chapter switched off in audit.config.ts doesn't exist.
  const section = url.pathname.split("/")[1] as keyof typeof auditConfig.modules;
  if (section in auditConfig.modules && !auditConfig.modules[section]) {
    return new NextResponse("Not found", { status: 404, headers: { "content-type": "text/plain" } });
  }

  // The prep pages don't exist for anyone without the key.
  if (!prepAllowed && url.pathname.startsWith("/prep")) {
    return new NextResponse("Not found", { status: 404, headers: { "content-type": "text/plain" } });
  }

  // Overwrite rather than trust anything a client sent under these names.
  const headers = new Headers(req.headers);
  headers.set("x-audit-prep-allowed", prepAllowed ? "1" : "0");
  headers.set("x-audit-view", view);
  const res = NextResponse.next({ request: { headers } });
  // The page differs by view, so no shared cache may ever hand one to the other.
  res.headers.set("Cache-Control", "private, no-store");
  res.headers.set("Vary", "Cookie");
  return res;
}

export const config = {
  matcher: ["/((?!_next/|logos/|icon|apple-icon|opengraph-image|favicon.ico|robots.txt).*)"],
};
