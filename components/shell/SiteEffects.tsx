"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Small page-wide behaviours:
 * - a deep link (#id) to a collapsed item opens it and makes it glow;
 * - printing opens every <details>, so a saved PDF has everything;
 * - .u-reveal elements fade in the first time they scroll into view.
 */
export default function SiteEffects() {
  const pathname = usePathname();

  // Deep links: open the target (and any collapsed parent), then flash it.
  useEffect(() => {
    const focusHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      let p: HTMLElement | null = el;
      while (p) {
        if (p instanceof HTMLDetailsElement) p.open = true;
        p = p.parentElement;
      }
      el.classList.remove("is-target");
      void el.offsetWidth;
      el.classList.add("is-target");
      requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
    };
    focusHash();
    window.addEventListener("hashchange", focusHash);
    return () => window.removeEventListener("hashchange", focusHash);
  }, [pathname]);

  // Print: expand everything, then put it back.
  useEffect(() => {
    let opened: HTMLDetailsElement[] = [];
    const before = () => {
      opened = Array.from(document.querySelectorAll("details:not([open])")) as HTMLDetailsElement[];
      opened.forEach((d) => (d.open = true));
      document.querySelectorAll(".u-reveal").forEach((el) => el.classList.add("is-in"));
    };
    const after = () => {
      opened.forEach((d) => (d.open = false));
      opened = [];
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  // Scroll reveal. The head script adds .js-reveal before paint; without JS everything is simply visible.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".u-reveal:not(.is-in)"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
