import type { Metadata, Viewport } from "next"
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google"
import { AppToaster } from "@/components/ui/app-toaster"
import { CookieNotice } from "@/components/legal/cookie-notice"
import { MotionProvider } from "@/components/providers/motion-provider"
import "./globals.css"

// Cuerpo: Plus Jakarta Sans. Humanista geométrica, con formas abiertas que
// aguantan bien los tamaños pequeños de un texto de venta largo. Sustituye a
// Inter, que es la sans por defecto de medio internet y no aporta carácter.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans-brand",
  display: "swap",
  preload: true,
})

// Titulares: Fraunces. Serif variable con carácter propio y, sobre todo, con
// eje óptico (`opsz`): a tamaño grande afina los remates y a tamaño pequeño
// los engorda, que es justo lo que le faltaba a Cormorant Garamond —a 6rem y
// en peso ligero se deshacía y perdía contraste contra el marfil del fondo.
//
// `SOFT` redondea los vértices lo justo para que no resulte severa.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["SOFT", "opsz"],
  preload: true,
})

// JetBrains Mono se retiró: se descargaba en cada visita y nunca se usaba
// (globals.css define --font-mono como ui-monospace, sin referenciarla).

export const metadata: Metadata = {
  title: {
    default: "Mitra | Desde la raíz",
    template: "%s | Mitra",
  },
  description:
    "Mitra es la plataforma de educación para tu desarrollo personal y espiritual. Formaciones, mentoría y comunidad para un cambio real desde la matriz originaria.",
  keywords: [
    "desarrollo personal",
    "transformación",
    "espiritualidad",
    "formación online",
    "mentoría",
    "crecimiento personal",
    "coaching",
  ],
  authors: [{ name: "Mitra" }],
  creator: "Mitra",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Mitra",
    title: "Mitra | Desde la raíz",
    description:
      "Formaciones y mentoría para tu desarrollo personal y espiritual",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mitra | Desde la raíz",
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
  // Permite pintar bajo el notch/barra de gestos; las utilidades .safe-* del
  // globals.css se encargan del padding real.
  viewportFit: "cover",
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
        className={`${jakarta.variable} ${fraunces.variable} font-sans antialiased`}
      >
        <MotionProvider>
          {children}
          <AppToaster />
          <CookieNotice />
        </MotionProvider>
      </body>
    </html>
  )
}
