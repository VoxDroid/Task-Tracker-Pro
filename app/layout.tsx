import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { NotificationProvider } from "@/components/notification"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "Task Tracker Pro",
  description: "Advanced task tracking and project management application",
    generator: 'VoxDroid'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <ThemeProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
