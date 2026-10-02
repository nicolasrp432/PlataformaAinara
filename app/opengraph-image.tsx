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
          <svg width="100" height="100" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="6.5" r="2.5" fill="#171717" />
            <path d="M6 23V15c0-3.8 4.1-5.3 6.2-2.1L16 19l3.8-6.1C21.9 9.7 26 11.2 26 15v8M16 19v8m0-4-4 4m4-4 4 4" stroke="#171717" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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
