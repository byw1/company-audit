"use client";

import { useEffect, useRef } from "react";

export interface Palette {
  live: [number, number, number];
  page: [number, number, number];
  ink: [number, number, number];
  dark: boolean;
}

function parse(color: string): [number, number, number] {
  const c = color.trim();
  if (c.startsWith("#")) {
    const h = c.length === 4 ? c.slice(1).split("").map((x) => x + x).join("") : c.slice(1, 7);
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
  }
  const m = c.match(/[\d.]+/g);
  return m ? (m.slice(0, 3).map((v) => Number(v) / 255) as [number, number, number]) : [0.5, 0.5, 0.5];
}

/** The live theme colours, read from CSS so the hero follows light/dark and the audit's accent. */
export function readPalette(): Palette {
  const s = getComputedStyle(document.documentElement);
  return {
    live: parse(s.getPropertyValue("--live")),
    page: parse(s.getPropertyValue("--page")),
    ink: parse(s.getPropertyValue("--ink")),
    dark: document.documentElement.dataset.theme === "dark",
  };
}

/**
 * Drives a canvas animation responsibly: starts after the page is idle, runs
 * only while on screen and the tab is visible, renders a single still frame
 * for reduced-motion users, and re-reads the palette when the theme changes.
 */
export function useCanvasLoop(
  setup: (canvas: HTMLCanvasElement, palette: Palette) => {
    frame: (t: number) => void;
    resize: (w: number, h: number, dpr: number) => void;
    palette: (p: Palette) => void;
    dispose?: () => void;
  } | null,
) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    let started = false;
    let api: ReturnType<typeof setup> = null;
    const t0 = performance.now();

    const loop = () => {
      if (!api) return;
      api.frame((performance.now() - t0) / 1000);
      if (!reduced && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      if (!api) return;
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      api.resize(Math.max(1, r.width), Math.max(1, r.height), dpr);
      if (reduced) kick();
    };

    const start = () => {
      if (started) return;
      started = true;
      api = setup(canvas, readPalette());
      if (!api) return;
      resize();
      canvas.dataset.ready = "1";
      kick();
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && started && !reduced) kick();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const mo = new MutationObserver(() => {
      api?.palette(readPalette());
      if (reduced) kick();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const onVis = () => !document.hidden && visible && !reduced && kick();
    document.addEventListener("visibilitychange", onVis);

    // Text first: wait until the browser is idle before spending anything on pixels.
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const idle = w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 1200 }) : window.setTimeout(start, 300);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (typeof idle === "number") window.clearTimeout(idle);
      api?.dispose?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
