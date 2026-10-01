import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClaimLegend } from "@/components/audit/Fact";
import { FramedMark } from "@/components/audit/Mark";
import PrepLayer from "@/components/prep/PrepLayer";
import Shell from "@/components/shell/Shell";
import themeJson from "@/content/generated/theme.json";
import { themeCss, type Theme } from "@/lib/color";
import { mono, sans, serif } from "@/lib/fonts";
import { audit, chapters, researchedLabel } from "@/lib/content";
import { ModeProvider } from "@/lib/mode";
import { getView } from "@/lib/view";

const { company, role, author } = audit.config;

// Without an absolute base, the link-preview image resolves against localhost
// and the card breaks wherever the link gets pasted. Set the domain before the
// build you intend to share (see README → Deploy).
const host =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");

const TITLE = `${company.name}, an outside-in read`;
const DESCRIPTION = `An outside-in read of ${company.name} for the ${role.title} role: how the business is set up, how the work flows, what they've said publicly, who they compete with, and what I'd do first. By ${author.name}.`;

// The view is decided per request (middleware.ts), so nothing is prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(host),
  title: { default: TITLE, template: `%s · ${company.name}, an outside-in read` },
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  authors: [{ name: author.name }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#111110" },
  ],
};

/**
 * Runs before first paint: applies the saved theme (or the OS's), presenter
 * mode (?present, or carried over from the last chapter), marks the document
 * as able to animate reveals, and notes the visitor's first interaction so the
 * hero canvas can start even if it mounts after that moment. No flash, and
 * no-JS readers still get every word.
 */
const BOOT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem("audit-theme");var dark=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);d.dataset.theme=dark?"dark":"light";}catch(e){}try{var q=new URLSearchParams(location.search);if(q.has("present")){sessionStorage.setItem("audit-present","1");}if(sessionStorage.getItem("audit-present")==="1"){d.setAttribute("data-present","");}}catch(e){}if(!matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("js-reveal");}var ev=["pointermove","pointerdown","keydown","wheel","touchstart","scroll"],on=function(){d.dataset.engaged="1";ev.forEach(function(e){removeEventListener(e,on,true)})};ev.forEach(function(e){addEventListener(e,on,{capture:true,passive:true})});})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const mode = await getView();
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        <style dangerouslySetInnerHTML={{ __html: themeCss(themeJson as Theme) }} />
      </head>
      <body className="min-h-screen antialiased">
        <ModeProvider mode={mode}>
          <Shell
            company={company.name}
            role={role.title}
            author={author}
            researched={researchedLabel}
            fictional={company.fictional}
            mark={<FramedMark />}
            chapters={chapters.map(({ id, href, label, kicker }) => ({ id, href, label, kicker }))}
              legend={<ClaimLegend />}
            prep={<PrepLayer />}
          >
            {children}
          </Shell>
        </ModeProvider>
      </body>
    </html>
  );
}
