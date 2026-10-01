import { ImageResponse } from "next/og";
import { brandFonts, INK, logoDataUrl, MarkTile, PAGE, theme } from "@/lib/brand-image";
import { audit, researchedLabel } from "@/lib/content";

/** The link preview, generated per audit: the mark, the company, the role, "an outside-in read". */
export const alt = `${audit.config.company.name}, an outside-in read`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const { company, role, author } = audit.config;
  const logo = await logoDataUrl(true);
  const live = theme.light.live;
  const nameSize = company.name.length > 22 ? 84 : company.name.length > 14 ? 100 : 118;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: `radial-gradient(900px 520px at 88% 30%, ${live}33, ${PAGE} 70%)`,
          fontFamily: "Geist",
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <MarkTile size={68} logo={logo} dotRing={PAGE} />
          <div style={{ display: "flex", fontFamily: "Geist Mono", fontSize: 22, letterSpacing: 4, color: "#68655d" }}>
            AN OUTSIDE-IN READ
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Instrument Serif", fontSize: nameSize, lineHeight: 1, letterSpacing: -1.5 }}>{company.name}</div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 36, color: "#4a4842" }}>
            For the {role.title} role
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 22, color: "#68655d" }}>
          <div style={{ display: "flex" }}>
            by {author.name} · {researchedLabel}
          </div>
          {company.fictional && (
            <div style={{ display: "flex", border: "2px dashed #9a968c", borderRadius: 8, padding: "4px 12px", fontFamily: "Geist Mono", fontSize: 18, letterSpacing: 2 }}>
              FICTIONAL EXAMPLE
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts: await brandFonts() },
  );
}
