import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google"
import "./globals.css"

// Performance: subset + display swap to avoid FOIT
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
})

// Luxury serif for headings - only needed weights
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["600", "700", "800"],
  preload: false, // Non-critical, load after Inter
})

// Monospace only if needed (load lazily)
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  title: {
    default: "Ainara | Plataforma de Transformación Personal",
    template: "%s | Ainara",
  },
  description:
    "Plataforma de educación para el desarrollo personal y espiritual. Formaciones, mentoría y comunidad para tu transformación.",
  keywords: [
    "desarrollo personal",
    "transformación",
    "espiritualidad",
    "formación online",
    "mentoría",
    "crecimiento personal",
    "coaching",
  ],
  authors: [{ name: "Ainara" }],
  creator: "Ainara",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Ainara",
    title: "Ainara | Plataforma de Transformación Personal",
    description:
      "Formaciones y mentoría para tu desarrollo personal y espiritual",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ainara | Plataforma de Transformación Personal",
    description:
      "Formaciones y mentoría para tu desarrollo personal y espiritual",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  // Warm gold as theme color for browser chrome
  themeColor: "#B8902E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
