import { ImageResponse } from "next/og";
import { brandFonts, INK, logoDataUrl, theme } from "@/lib/brand-image";
import { audit } from "@/lib/content";
import { initials } from "@/lib/logos";

/** Home-screen icon: full-bleed (iOS fills transparency with black), same mark. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const logo = await logoDataUrl(true);
  const inner = 104;
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: INK, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {logo ? (
           
          <img src={logo} width={inner} height={inner} style={{ borderRadius: 24, background: "#ffffff" }} alt="" />
        ) : (
          <div
            style={{
              width: inner,
              height: inner,
              borderRadius: 26,
              background: theme.light.live,
              color: theme.light.liveContrast,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontFamily: "Geist Mono",
            }}
          >
            {initials(audit.config.company.name)}
          </div>
        )}
        <div style={{ position: "absolute", top: 22, right: 22, width: 26, height: 26, borderRadius: 26, background: theme.light.live }} />
      </div>
    ),
    { ...size, fonts: await brandFonts() },
  );
}
