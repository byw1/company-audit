"use client";

import { useCanvasLoop, type Palette } from "./useCanvasLoop";

/**
 * Particles drifting through a slow flow field, thickening toward the right:
 * work flowing through a system. Canvas 2D, no libraries.
 */
export default function ParticlesHero() {
  const ref = useCanvasLoop((canvas, initial) => {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return null;
    let W = 1;
    let H = 1;
    let pal = initial;
    const N = 700;
    const pts = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), a: Math.random(), s: 0.4 + Math.random() * 0.8 }));
    const rgb = (c: Palette["live"], a: number) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
    const field = (x: number, y: number, t: number) =>
      Math.sin(x * 3.1 + t * 0.15) * 1.1 + Math.cos(y * 4.3 - t * 0.12) * 0.9 + Math.sin((x + y) * 2.2 + t * 0.07);

    return {
      resize: (w, h, dpr) => {
        W = w;
        H = h;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      },
      palette: (p) => (pal = p),
      frame: (t) => {
        ctx.clearRect(0, 0, W, H);
        for (const p of pts) {
          const ang = field(p.x, p.y, t);
          p.x += Math.cos(ang) * 0.0009 * p.s + 0.0006 * p.s;
          p.y += Math.sin(ang) * 0.0009 * p.s;
          if (p.x > 1.02 || p.y < -0.02 || p.y > 1.02) {
            p.x = -0.02 + Math.random() * 0.1;
            p.y = Math.random();
          }
          const lean = Math.min(1, Math.max(0, (p.x - 0.15) / 0.75));
          const alpha = (0.15 + 0.6 * lean) * (0.5 + 0.5 * Math.sin(t * 0.8 + p.a * 6.28));
          const r = 0.6 + lean * 1.3 * p.s;
          ctx.fillStyle = p.a > 0.82 ? rgb(pal.ink, alpha * 0.5) : rgb(pal.live, alpha);
          ctx.beginPath();
          ctx.arc(p.x * W, p.y * H, r, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    };
  });

  return <canvas ref={ref} aria-hidden className="absolute inset-0 size-full opacity-0 transition-opacity duration-[1400ms] data-[ready]:opacity-100" />;
}
