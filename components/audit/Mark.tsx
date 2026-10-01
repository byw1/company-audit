import { audit } from "@/lib/content";
import { CompanyLogo } from "./CompanyLogo";

/**
 * The site's mark: the company's icon inside my frame (a dark rounded tile
 * with a small accent dot), so a tab is recognisable but the site never looks
 * like the company's own property. The favicon is drawn the same way
 * (app/icon.tsx).
 */
export function FramedMark({ size = 28 }: { size?: number }) {
  const { domain, iconDomain, name } = audit.config.company;
  const dot = Math.max(7, Math.round(size * 0.3));
  return (
    <span
      className="relative inline-grid shrink-0 place-items-center bg-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3) }}
      aria-hidden
    >
      <CompanyLogo domain={iconDomain ?? domain} name={name} size={Math.round(size * 0.62)} tone="solid" />
      <span
        className="absolute rounded-full bg-live ring-2 ring-page"
        style={{ width: dot, height: dot, top: -Math.round(dot * 0.3), right: -Math.round(dot * 0.3) }}
      />
    </span>
  );
}
