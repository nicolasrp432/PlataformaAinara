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
            background: "linear-gradient(135deg, #F6D25C, #B8902E)",
            marginBottom: 48,
          }}
        >
          <svg width="88" height="88" viewBox="0 0 24 24" fill="none">
            <path d="M2 20 L8 8 L12 14 L16 6 L22 20 Z" fill="#FFFFFF" opacity="0.92" />
            <circle cx="9.5" cy="17" r="0.85" fill="#B8902E" />
            <circle cx="11.2" cy="14.2" r="0.85" fill="#B8902E" />
            <circle cx="13.2" cy="11" r="0.85" fill="#B8902E" />
            <circle cx="15.2" cy="7.8" r="0.85" fill="#B8902E" />
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
