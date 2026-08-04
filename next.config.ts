import type { NextConfig } from "next"

// Origen de Supabase para el preconnect. Si la variable no está definida en el
// entorno de build, se cae a un valor inocuo y el header simplemente no ayuda.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin
  } catch {
    return "https://supabase.co"
  }
})()

const nextConfig: NextConfig = {
  // ── Image optimization ─────────────────────────────────────
  images: {
    // Modern formats first (AVIF > WebP > original)
    formats: ["image/avif", "image/webp"],
    // Aggressive caching: 30 days for optimized images
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      // Cloudflare Stream / Images
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
      // Supabase Storage
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
      // YouTube thumbnails (used for lesson thumbnails)
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      // Vimeo thumbnails
      {
        protocol: "https",
        hostname: "i.vimeocdn.com",
      },
      // Hosts habituales cuando el admin pega una URL de imagen a mano.
      // Cualquier otro host cae al FormationCover de <MediaImage>, así que
      // nunca queda un hueco vacío.
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
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
      "framer-motion",
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
    // Remove console.log in production (keep errors and warnings)
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
          {
            // next/font auto-hospeda las tipografías, así que el preconnect a
            // fonts.googleapis.com no servía de nada. El origen del que sí
            // depende cada pantalla es Supabase: adelantar DNS + TLS ahí ahorra
            // el handshake de la primera consulta.
            key: "Link",
            value: `<${supabaseOrigin}>; rel=preconnect; crossorigin`,
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
