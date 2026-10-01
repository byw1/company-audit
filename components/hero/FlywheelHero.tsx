"use client";

import * as THREE from "three";
import { isSoftwareRenderer, useCanvasLoop, type Palette } from "./useCanvasLoop";

/**
 * The business as a flywheel (ported from the SuperOrdinary audit): a core,
 * three tilted orbits carrying work and money around it, and a steady inflow
 * spiralling in from the edge. Plain three.js, loaded only when an audit
 * chooses this hero.
 */

const RINGS = [
  { r: 1.95, tilt: [1.2, 0.2, 0], speed: 0.32, count: 150 },
  { r: 2.45, tilt: [1.45, -0.55, 0.3], speed: -0.22, count: 190 },
  { r: 3.0, tilt: [1.0, 0.7, -0.25], speed: 0.16, count: 230 },
] as const;
const INFLOW = 260;

function spriteTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.65)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export default function FlywheelHero() {
  const ref = useCanvasLoop((canvas, initial) => {
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return null;
    }
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.3, 9.4);
    const rig = new THREE.Group();
    scene.add(rig);

    const col = (c: Palette["live"]) => new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);

    // Core: a glowing heart, a faint shell, a slowly turning cage.
    const coreMat = new THREE.MeshBasicMaterial();
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 32), coreMat);
    const shellMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.1, depthWrite: false });
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1.05, 48, 48), shellMat);
    const cageMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.2 });
    const cage = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.32, 1)), cageMat);
    rig.add(shell, core, cage);

    // Orbits.
    const ringMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.16 });
    const ringMatrices = RINGS.map((r) => new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(r.tilt[0], r.tilt[1], r.tilt[2])));
    RINGS.forEach((r) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(r.r, 0.0045, 8, 256), ringMat);
      m.rotation.set(r.tilt[0], r.tilt[1], r.tilt[2]);
      rig.add(m);
    });

    // Particles: work and money on the orbits, the inflow spiralling in.
    const total = RINGS.reduce((s, r) => s + r.count, 0) + INFLOW;
    const seeds: { ring: number; phase: number; wobble: number; size: number; money: boolean }[] = [];
    RINGS.forEach((r, ri) => {
      for (let i = 0; i < r.count; i++)
        seeds.push({ ring: ri, phase: Math.random() * Math.PI * 2, wobble: (Math.random() - 0.5) * 0.12, size: 0.6 + Math.random(), money: Math.random() < 0.28 });
    });
    for (let i = 0; i < INFLOW; i++) seeds.push({ ring: -1, phase: Math.random(), wobble: Math.random() * Math.PI * 2, size: 0.5 + Math.random() * 0.7, money: false });

    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pointsMat = new THREE.PointsMaterial({ size: 0.11, map: spriteTexture(), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true });
    const points = new THREE.Points(geo, pointsMat);
    rig.add(points);

    const v = new THREE.Vector3();
    let wide = true;
    let worldW = 10;
    const target = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const setPalette = (p: Palette) => {
      const live = col(p.live);
      const ink = col(p.ink);
      coreMat.color.copy(live);
      shellMat.color.copy(live);
      cageMat.color.copy(ink);
      ringMat.color.copy(ink);
      // Additive light on dark; ordinary blending on paper, where additive would vanish.
      pointsMat.blending = p.dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      pointsMat.needsUpdate = true;
      const warm = live.clone().lerp(ink, 0.55);
      seeds.forEach((s, i) => {
        const c = s.money ? live : s.ring < 0 ? warm : ink;
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      });
      geo.attributes.color.needsUpdate = true;
    };
    setPalette(initial);

    let last = 0;
    return {
      still: isSoftwareRenderer(renderer.getContext()),
      resize: (w, h, dpr) => {
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        wide = camera.aspect > 1.1;
        const visibleH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
        worldW = visibleH * camera.aspect;
      },
      palette: setPalette,
      frame: (t) => {
        const dt = Math.min(0.05, t - last);
        last = t;
        rig.position.set(wide ? worldW * 0.3 : 0, wide ? 0.15 : 0.9, 0);
        rig.scale.setScalar(wide ? 1 : 0.72);
        const k = 1 - Math.exp(-dt * 2.2);
        rig.rotation.y += (target.x * 0.35 + t * 0.03 - rig.rotation.y) * k;
        rig.rotation.x += (-target.y * 0.2 + 0.12 - rig.rotation.x) * k;
        shell.rotation.y += dt * 0.12;
        cage.rotation.y -= dt * 0.08;
        cage.rotation.x += dt * 0.04;
        core.scale.setScalar(1 + Math.sin(t * 1.6) * 0.03);

        seeds.forEach((s, i) => {
          if (s.ring >= 0) {
            const ring = RINGS[s.ring];
            const a = s.phase + t * ring.speed;
            const r = ring.r + s.wobble;
            v.set(Math.cos(a) * r, Math.sin(a) * r, s.wobble * 0.6).applyMatrix4(ringMatrices[s.ring]);
          } else {
            const p = (s.phase + t * 0.06) % 1;
            const r = 4.4 * (1 - p) + 1.1 * p;
            const a = s.wobble + p * 5.5;
            v.set(Math.cos(a) * r, Math.sin(s.wobble * 3) * 1.4 * (1 - p), Math.sin(a) * r);
          }
          positions[i * 3] = v.x;
          positions[i * 3 + 1] = v.y;
          positions[i * 3 + 2] = v.z;
        });
        geo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
      },
      dispose: () => {
        window.removeEventListener("pointermove", onPointer);
        renderer.dispose();
      },
    };
  });

  return <canvas ref={ref} aria-hidden className="absolute inset-0 size-full opacity-0 transition-opacity duration-[1400ms] data-[ready]:opacity-100" />;
}
