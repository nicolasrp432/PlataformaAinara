import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,#FFECA6,#F6D25C 55%,#B8902E)",
        borderRadius: 45,
      }}
    >
      <svg width="144" height="144" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="6.5" r="2.5" fill="#171717" />
        <path
          d="M6 23V15c0-3.8 4.1-5.3 6.2-2.1L16 19l3.8-6.1C21.9 9.7 26 11.2 26 15v8M16 19v8m0-4-4 4m4-4 4 4"
          stroke="#171717"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>,
    size,
  );
}
