import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "company-logos CLI",
  description: "Generate React components from company logos",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${geist.style.fontFamily};
  --font-sans: ${geist.variable};
  --font-mono: ${geistMono.variable};
}
        `}</style>
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans dark`}>{children}</body>
    </html>
  )
}
