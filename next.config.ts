import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // ── Image optimization ─────────────────────────────────────
  images: {
    // Modern formats first (AVIF > WebP > original)
    formats: ["image/avif", "image/webp"],
    // Aggressive caching: 30 days for optimized images
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.cloudflare.com",
      },
      {
        protocol: "https",
        hostname: "imagedelivery.net",
      },
      {
        protocol: "https",
        hostname: "customer-*.cloudflarestream.com",
      },
    ],
  },

  // ── Experimental features ──────────────────────────────────
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Optimize package imports to avoid barrel file waterfalls
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-progress",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
    ],
  },

  // ── Compiler options ──────────────────────────────────────
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  // ── Headers: Security + performance ──────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent layout shifts from font loading
          {
            key: "Link",
            value: "<https://fonts.googleapis.com>; rel=preconnect",
          },
        ],
      },
      // Static assets: aggressive cache
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
}

export default nextConfig
