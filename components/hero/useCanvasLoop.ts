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

/** True when WebGL is drawn by the CPU (no GPU, or a headless test browser): animate nothing there. */
export function isSoftwareRenderer(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  try {
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? "");
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch {
    return false;
  }
}

/**
 * Drives a canvas animation responsibly: starts after the page is idle, runs
 * only while on screen and the tab is visible, renders a single still frame
 * for reduced-motion users (and on devices that can't keep up), and re-reads
 * the palette when the theme changes.
 */
export function useCanvasLoop(
  setup: (canvas: HTMLCanvasElement, palette: Palette) => {
    frame: (t: number) => void;
    resize: (w: number, h: number, dpr: number) => void;
    palette: (p: Palette) => void;
    dispose?: () => void;
    /** Draw one still frame and never animate (e.g. software WebGL). */
    still?: boolean;
  } | null,
) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    let started = false;
    let api: ReturnType<typeof setup> = null;
    const t0 = performance.now();

    // If the device can't keep up, settle on a still frame rather than
    // spending the reader's main thread on decoration.
    let slow = 0;
    let frames = 0;
    const loop = () => {
      if (!api) return;
      const a = performance.now();
      api.frame((a - t0) / 1000);
      const cost = performance.now() - a;
      frames++;
      if (frames <= 12 && cost > 40) slow++;
      if (slow >= 2) reduced = true;
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
      if (api.still) reduced = true;
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

    // Text first. The canvas starts on the visitor's first sign of life (a
    // pointer move, a scroll, a key, a touch) once the page has loaded, and the
    // static gradient behind it stands in until then. A real person triggers
    // it at once; a page nobody is looking at never pays for it.
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const EVENTS = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
    let idle = 0;
    let loaded = document.readyState === "complete";
    // The boot script (app/layout.tsx) records an interaction that happened before this mounted.
    let engaged = document.documentElement.dataset.engaged === "1";
    const go = () => {
      if (!loaded || !engaged || started) return;
      idle = w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 600 }) : window.setTimeout(start, 50);
    };
    const onEngage = () => {
      engaged = true;
      EVENTS.forEach((e) => window.removeEventListener(e, onEngage));
      go();
    };
    const onLoad = () => {
      loaded = true;
      go();
    };
    if (!engaged) EVENTS.forEach((e) => window.addEventListener(e, onEngage, { passive: true, once: true }));
    if (!loaded) window.addEventListener("load", onLoad, { once: true });
    go();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("load", onLoad);
      EVENTS.forEach((e) => window.removeEventListener(e, onEngage));
      if (w.cancelIdleCallback) w.cancelIdleCallback(idle);
      window.clearTimeout(idle);
      api?.dispose?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
