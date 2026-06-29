import type { Metadata, Viewport } from "next"
import { Bebas_Neue, Outfit } from "next/font/google"
import { CartProvider } from "@/components/cart-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const norwester = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-norwester",
  display: "swap",
})

const garet = Outfit({
  subsets: ["latin"],
  variable: "--font-garet",
  display: "swap",
})

export const metadata: Metadata = {
  title: "TermoStore — Hogar & Electro al por mayor",
  description:
    "Importadora mayorista de electrodomésticos y artículos para el hogar. Pedí por WhatsApp y aprovechá precios mayoristas.",
  icons: {
    icon: "/TERMOSTORE%20PLACAS.png",
    shortcut: "/TERMOSTORE%20PLACAS.png",
    apple: "/TERMOSTORE%20PLACAS.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#F3D6E0",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${norwester.variable} ${garet.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased text-ink" suppressHydrationWarning>
        <CartProvider>{children}</CartProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
