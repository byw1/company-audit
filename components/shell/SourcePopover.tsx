"use client";

import { useEffect, useState } from "react";

interface Card {
  title: string;
  meta: string;
  x: number;
  y: number;
  w: number;
  below: boolean;
}

/**
 * One popover for every source link on the page. Each [n] carries its source's
 * title and details as data attributes; this shows them on hover (pointer
 * devices) or keyboard focus, positioned within the viewport. One small
 * listener instead of a hidden card per claim keeps the pages light.
 */
export default function SourcePopover() {
  const [card, setCard] = useState<Card | null>(null);

  useEffect(() => {
    const canHover = matchMedia("(hover: hover)").matches;
    const find = (t: EventTarget | null) => (t instanceof Element ? (t.closest("a[data-src-title]") as HTMLAnchorElement | null) : null);
    const show = (a: HTMLAnchorElement) => {
      const r = a.getBoundingClientRect();
      const w = Math.min(304, window.innerWidth - 16);
      const x = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8));
      const below = r.top < 140;
      setCard({ title: a.dataset.srcTitle ?? "", meta: a.dataset.srcMeta ?? "", x, y: below ? r.bottom + 6 : r.top - 6, w, below });
    };
    const over = (e: PointerEvent) => {
      if (!canHover || e.pointerType === "touch") return;
      const a = find(e.target);
      if (a) show(a);
    };
    const out = (e: PointerEvent) => {
      const a = find(e.target);
      if (a && !(e.relatedTarget instanceof Node && a.contains(e.relatedTarget))) setCard(null);
    };
    const focusIn = (e: FocusEvent) => {
      const a = find(e.target);
      if (a) show(a);
    };
    const hide = () => setCard(null);
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    document.addEventListener("focusin", focusIn);
    document.addEventListener("focusout", hide);
    window.addEventListener("scroll", hide, { passive: true });
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      document.removeEventListener("focusin", focusIn);
      document.removeEventListener("focusout", hide);
      window.removeEventListener("scroll", hide);
    };
  }, []);

  if (!card) return null;
  return (
    <div
      role="tooltip"
      style={{ left: card.x, top: card.y, width: card.w, transform: card.below ? undefined : "translateY(-100%)" }}
      className="no-print pointer-events-none fixed z-50 rounded-lg border border-line bg-surface p-2.5 text-left shadow-[var(--shadow-pop)]"
    >
      <span className="block text-[12px] leading-snug font-medium text-ink">{card.title}</span>
      <span className="mt-0.5 block font-mono text-[10px] tracking-[0.04em] text-ink-3">{card.meta}</span>
    </div>
  );
}
