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
        background: "#29251E",
        borderRadius: 45,
      }}
    >
      <svg width="144" height="144" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="6.7" r="2.45" fill="#E9B93F" />
        <path
          d="M5.5 22V15c0-3.5 4.3-5 6.25-2.05L16 19.35l4.25-6.4C22.2 10 26.5 11.5 26.5 15v7M16 18.9v8.4M16 23.1l-4.25 4.15M16 23.1l4.25 4.15"
          stroke="#E9B93F"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>,
    size,
  );
}
