import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Mitra | Desde la raíz"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F5F1E8",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(246,210,92,0.25), transparent 55%), radial-gradient(circle at 80% 80%, rgba(184,144,46,0.18), transparent 55%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            borderRadius: 32,
            background: "#29251E",
            marginBottom: 48,
          }}
        >
          <svg width="100" height="100" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="6.3" r="2.45" fill="#E9B93F" />
            <path d="M5.5 21.7V15c0-3.5 4.3-5 6.25-2.05L16 19.35l4.25-6.4C22.2 10 26.5 11.5 26.5 15v6.7M16 18.9v8.4M16 23.1l-4.25 4.15M16 23.1l4.25 4.15" stroke="#E9B93F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div
          style={{
            fontSize: 120,
            fontFamily: "Georgia, serif",
            fontWeight: 600,
            letterSpacing: 6,
            color: "#171717",
          }}
        >
          Mitra
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 34,
            letterSpacing: 14,
            textTransform: "uppercase",
            color: "#B8902E",
          }}
        >
          Desde la raíz
        </div>
      </div>
    ),
    { ...size }
  )
}
