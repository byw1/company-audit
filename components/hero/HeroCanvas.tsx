"use client";

import dynamic from "next/dynamic";

/**
 * The hero is a slot: audit.config.ts picks the variant. Each one is its own
 * chunk, loaded only when chosen, client-side only, after the text has painted.
 */
const VARIANTS = {
  shader: dynamic(() => import("./ShaderHero"), { ssr: false, loading: () => null }),
  particles: dynamic(() => import("./ParticlesHero"), { ssr: false, loading: () => null }),
  flywheel: dynamic(() => import("./FlywheelHero"), { ssr: false, loading: () => null }),
} as const;

export type HeroVariant = keyof typeof VARIANTS;

export default function HeroCanvas({ variant }: { variant: HeroVariant }) {
  const V = VARIANTS[variant];
  return <V />;
}
