import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono, Cormorant_Garamond } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  preload: true,
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  title: {
    default: "Sendero | El camino de tu transformación",
    template: "%s | Sendero",
  },
  description:
    "Sendero es la plataforma de educación para tu desarrollo personal y espiritual. Formaciones, mentoría y comunidad para recorrer tu camino interior.",
  keywords: [
    "desarrollo personal",
    "transformación",
    "espiritualidad",
    "formación online",
    "mentoría",
    "crecimiento personal",
    "coaching",
  ],
  authors: [{ name: "Sendero" }],
  creator: "Sendero",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Sendero",
    title: "Sendero | El camino de tu transformación",
    description:
      "Formaciones y mentoría para tu desarrollo personal y espiritual",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sendero | El camino de tu transformación",
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
        className={`${inter.variable} ${cormorant.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
