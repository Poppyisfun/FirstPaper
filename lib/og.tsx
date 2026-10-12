import { ImageResponse } from "next/og";

/**
 * The share card, rendered at build time for the landing page, the library
 * and each paper.
 *
 * Satori cannot read CSS custom properties, so the values below are copied
 * from the :root block in app/globals.css, which stays the source of truth.
 * Change a colour there and change it here.
 */
const T = {
  ink: "#0A0E14",
  bg: "#FAF9F6",
  soft: "#A9B7C2",
  green: "#5FCCA8",
  gold: "#F0C476",
};

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";

export function ogCard({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: T.ink,
          backgroundImage:
            "radial-gradient(720px 340px at 82% 6%, rgba(91,75,214,.34), transparent 62%), radial-gradient(620px 320px at 6% 96%, rgba(11,150,110,.28), transparent 62%)",
          color: T.bg,
        }}
      >
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: -1 }}>
          First<span style={{ color: T.green }}>Paper</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: T.green,
              marginBottom: 22,
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 60 ? 54 : 64,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          {sub && (
            <div style={{ display: "flex", fontSize: 28, color: T.soft, marginTop: 24, maxWidth: 960 }}>
              {sub}
            </div>
          )}
        </div>

        <div style={{ display: "flex", fontSize: 22, color: T.gold }}>
          FirstPaper can be wrong — that&rsquo;s the point.
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
