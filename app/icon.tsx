import { ImageResponse } from "next/og";
import { brandFonts, logoDataUrl, MarkTile } from "@/lib/brand-image";

/** The tab icon: the company's icon inside my frame, so the tab is recognisable but never looks like their own site. */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const logo = await logoDataUrl(false);
  return new ImageResponse(
    (
      <div style={{ width: 64, height: 64, display: "flex", alignItems: "flex-end", justifyContent: "flex-start", padding: 3 }}>
        <MarkTile size={54} logo={logo} dotRing="#ffffff" />
      </div>
    ),
    { ...size, fonts: await brandFonts() },
  );
}
