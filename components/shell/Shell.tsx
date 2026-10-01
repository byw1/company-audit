"use client";

import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { chapterFor } from "@/lib/chapters";
import { TLink, useMode, useToggleHref, withShare } from "@/lib/mode";
import type { SearchItem } from "@/lib/search-types";
import { cn } from "@/lib/utils";
import CommandPalette from "./CommandPalette";
import { SearchProvider } from "./search-context";
import SiteEffects from "./SiteEffects";
import ThemeToggle from "./ThemeToggle";

export interface ShellChapter {
  id: string;
  href: string;
  label: string;
  kicker: string;
}

export interface ShellProps {
  company: string;
  role: string;
  author: { name: string; email: string; linkedin: string };
  researched: string;
  fictional: boolean;
  /** The framed company mark, rendered on the server. */
  mark: ReactNode;
  chapters: ShellChapter[];
  searchItems: SearchItem[];
  /** The claim-label legend, rendered on the server. */
  legend: ReactNode;
  /** <PrepLayer>: renders nothing unless the server decided this is the prep view. */
  prep: ReactNode;
  children: ReactNode;
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export default function Shell(props: ShellProps) {
  const { company, role, author, researched, fictional, mark, chapters, searchItems, legend, prep, children } = props;
  const pathname = usePathname();
  const router = useRouter();
  const { share, prepAllowed } = useMode();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [present, setPresent] = useState(false);

  const current = chapterFor(pathname);
  const index = Math.max(0, chapters.findIndex((c) => c.id === current?.id));

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    setPresent(document.documentElement.hasAttribute("data-present"));
  }, []);

  const setPresenting = useCallback((v: boolean) => {
    const html = document.documentElement;
    if (v) html.setAttribute("data-present", "");
    else html.removeAttribute("data-present");
    try {
      if (v) sessionStorage.setItem("audit-present", "1");
      else sessionStorage.removeItem("audit-present");
    } catch {}
    setPresent(v);
  }, []);

  const go = useCallback(
    (i: number) => {
      const c = chapters[(i + chapters.length) % chapters.length];
      router.push(prepAllowed && share ? withShare(c.href) : c.href);
      window.scrollTo({ top: 0 });
    },
    [chapters, router, prepAllowed, share],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (open || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setPresenting(!document.documentElement.hasAttribute("data-present"));
      } else if (present && e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
      } else if (present && e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
      } else if (present && e.key === "Escape") {
        setPresenting(false);
      } else if (e.key === "/") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, present, index, go, setPresenting]);

  const overHero = pathname === "/" && !scrolled;

  return (
    <SearchProvider base={searchItems}>
      <a
        href="#main"
        className="chrome sr-only z-50 rounded-md bg-ink px-3 py-2 text-[13px] text-page focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "chrome sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
          overHero ? "border-transparent bg-transparent" : "border-line-soft bg-page/80 backdrop-blur-xl backdrop-saturate-150",
        )}
      >
        <div className="mx-auto flex h-14 w-full max-w-[1320px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <TLink href="/" className="group flex min-w-0 items-center gap-2.5" aria-label={`An outside-in read of ${company}, by ${author.name}. Home`}>
            {mark}
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[13px]">
                <span className="hidden text-ink-3 sm:inline">An outside-in read of </span>
                <span className="font-medium text-ink">{company}</span>
                <span className="hidden text-ink-3 sm:inline">, by {author.name}</span>
              </span>
              <span className="block truncate text-[11px] text-ink-3 sm:hidden">An outside-in read, by {author.name}</span>
            </span>
          </TLink>

          <nav aria-label="Chapters" className="ml-auto hidden items-center gap-0.5 xl:flex">
            {chapters.map((c) => (
              <TLink
                key={c.id}
                href={c.href}
                aria-current={current?.id === c.id ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                  current?.id === c.id ? "bg-hover font-medium text-ink" : "text-ink-2 hover:bg-hover hover:text-ink",
                )}
              >
                {c.label}
              </TLink>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 xl:ml-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Search this audit"
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-line bg-surface/70 px-2.5 text-[12.5px] text-ink-3 transition-colors hover:border-line-strong hover:text-ink"
            >
              <Search className="size-[14px]" strokeWidth={1.75} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded border border-line px-1 font-mono text-[10px] text-ink-3 sm:inline">⌘K</kbd>
            </button>
            <ThemeToggle />
            {prepAllowed && <ModeSwitch />}
          </div>
        </div>

        {/* Below xl the chapters scroll in a strip of their own. */}
        <nav aria-label="Chapters" className="mx-auto flex w-full max-w-[1320px] gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] sm:px-5 xl:hidden [&::-webkit-scrollbar]:hidden">
          {chapters.map((c) => (
            <TLink
              key={c.id}
              href={c.href}
              aria-current={current?.id === c.id ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-[12.5px] transition-colors",
                current?.id === c.id ? "bg-ink text-page" : "text-ink-2 hover:bg-hover hover:text-ink",
              )}
            >
              {c.label}
            </TLink>
          ))}
        </nav>
      </header>

      <main id="main" className="min-h-[70vh]">
        {children}
      </main>

      <footer className="chrome mt-16 border-t border-line-soft bg-inset/50">
        <div className="mx-auto w-full max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="max-w-[64ch]">
              <p className="text-[13.5px] leading-relaxed text-ink-2">
                An outside-in read of {company} for the {role} role, by {author.name}. Built from public sources only; not
                affiliated with or endorsed by {company}. {researched}.
                {fictional && " The company in this example is fictional, and so is everything about it."}
              </p>
              <div className="mt-5">{legend}</div>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
              <button type="button" onClick={() => window.print()} className="no-print text-ink-2 hover:text-ink">
                Save as PDF
              </button>
              <button type="button" onClick={() => setPresenting(true)} className="no-print text-ink-2 hover:text-ink" title="Presenter mode (P)">
                Present
              </button>
              <a href={`mailto:${author.email}`} className="text-ink-2 hover:text-ink">
                {author.email}
              </a>
              <a href={author.linkedin} className="text-ink-2 hover:text-ink">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>

      <CommandPalette open={open} onOpenChange={setOpen} />

      {present && (
        <PresentHud
          index={index}
          total={chapters.length}
          label={chapters[index]?.kicker ?? ""}
          onPrev={() => go(index - 1)}
          onNext={() => go(index + 1)}
          onExit={() => setPresenting(false)}
        />
      )}

      {prep}
      <SiteEffects />
    </SearchProvider>
  );
}

function ModeSwitch() {
  const { share } = useMode();
  const href = useToggleHref();
  return (
    <a
      href={href}
      title={share ? "Previewing exactly what a recipient sees. Switch back to prep." : "Preview exactly what a recipient sees."}
      className="no-print ml-1 flex items-center rounded-lg border border-line bg-surface/70 p-0.5 text-[11.5px]"
    >
      <span className={cn("rounded-md px-2 py-0.5", !share ? "bg-ink text-page" : "text-ink-3")}>Prep</span>
      <span className={cn("rounded-md px-2 py-0.5", share ? "bg-live text-live-contrast" : "text-ink-3")}>Share</span>
    </a>
  );
}

/** Presenter mode's only chrome: where you are, and how to move. Fades when the pointer rests. */
function PresentHud({
  index,
  total,
  label,
  onPrev,
  onNext,
  onExit,
}: {
  index: number;
  total: number;
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
}) {
  const [awake, setAwake] = useState(true);
  useEffect(() => {
    let t = window.setTimeout(() => setAwake(false), 2400);
    const wake = () => {
      setAwake(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setAwake(false), 2400);
    };
    window.addEventListener("mousemove", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [index]);

  return (
    <div
      className={cn(
        "no-print fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-surface/90 p-1 shadow-[var(--shadow-pop)] backdrop-blur-xl transition-opacity duration-500",
        awake ? "opacity-100" : "opacity-0",
      )}
    >
      <button type="button" onClick={onPrev} aria-label="Previous chapter" className="inline-grid size-8 place-items-center rounded-full text-ink-2 hover:bg-hover hover:text-ink">
        <ArrowLeft className="size-4" />
      </button>
      <span className="px-2 text-[12.5px] text-ink-2">
        <span className="u-num text-ink">{String(index + 1).padStart(2, "0")}</span>
        <span className="text-ink-3"> / {String(total).padStart(2, "0")}</span>
        <span className="ml-2">{label}</span>
      </span>
      <button type="button" onClick={onNext} aria-label="Next chapter" className="inline-grid size-8 place-items-center rounded-full text-ink-2 hover:bg-hover hover:text-ink">
        <ArrowRight className="size-4" />
      </button>
      <button type="button" onClick={onExit} className="ml-1 rounded-full px-3 py-1.5 text-[12px] text-ink-3 hover:bg-hover hover:text-ink">
        Esc
      </button>
    </div>
  );
}
