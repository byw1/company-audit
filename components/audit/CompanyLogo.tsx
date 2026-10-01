import { initials, logoFor } from "@/lib/logos";
import { cn } from "@/lib/utils";

/**
 * A company's icon, from the local cache written by `npm run logos` (never
 * hotlinked). If the domain has no icon, a monogram tile in the accent.
 */
export function CompanyLogo({
  domain,
  name,
  size = 20,
  alt,
  tone = "tint",
  className,
}: {
  domain: string;
  /** Used for the monogram's letters. Defaults to the domain. */
  name?: string;
  size?: number;
  /** Empty (decorative) by default, because a name is almost always beside it. */
  alt?: string;
  /** Monogram style: a tinted tile, or a solid accent tile (for dark frames). */
  tone?: "tint" | "solid";
  className?: string;
}) {
  const entry = logoFor(domain);
  const radius = Math.max(3, Math.round(size * 0.24));
  if (entry.status === "icon" && entry.src) {
    const src = size > 30 && entry.src180 ? entry.src180 : entry.src;
    return (
      <img
        src={src}
        width={size}
        height={size}
        alt={alt ?? ""}
        loading="lazy"
        decoding="async"
        draggable={false}
        style={{ borderRadius: radius }}
        className={cn("inline-block shrink-0 bg-white object-contain ring-1 ring-line", className)}
      />
    );
  }
  return (
    <span
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      style={{ width: size, height: size, borderRadius: radius, fontSize: Math.max(8, Math.round(size * 0.4)) }}
      className={cn(
        "inline-grid shrink-0 place-items-center font-mono leading-none font-semibold tracking-[-0.02em] select-none",
        tone === "solid" ? "bg-live text-live-contrast" : "bg-live-tint text-live-ink ring-1 ring-live-line",
        className,
      )}
    >
      {initials(name ?? domain)}
    </span>
  );
}
