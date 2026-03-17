import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Ainara - Plataforma de Transformacion Personal",
    template: "%s | Ainara",
  },
  description:
    "Plataforma de educacion para el desarrollo personal y espiritual. Formaciones, mentoria y comunidad para tu transformacion.",
  keywords: [
    "desarrollo personal",
    "transformacion",
    "espiritualidad",
    "formacion online",
    "mentoria",
    "crecimiento personal",
  ],
  authors: [{ name: "Ainara" }],
  creator: "Ainara",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Ainara",
    title: "Ainara - Plataforma de Transformacion Personal",
    description:
      "Formaciones y mentoria para tu desarrollo personal y espiritual",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ainara - Plataforma de Transformacion Personal",
    description:
      "Formaciones y mentoria para tu desarrollo personal y espiritual",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0d7377" },
    { media: "(prefers-color-scheme: dark)", color: "#14b8a6" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
