import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { NotificationProvider } from "@/components/notification"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "@/components/providers"
import { TitleBar } from "@/components/title-bar"
import "./globals.css"

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "Task Tracker Pro",
  description: "Advanced task tracking and project management application",
  icons: {
    icon: '/placeholder-logo.png',
    apple: '/placeholder-logo.png',
  },
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
        <Providers>
          <ThemeProvider>
            <div className="h-screen flex flex-col">
              <TitleBar />
              <div className="flex-1 overflow-hidden">
                <NotificationProvider>{children}</NotificationProvider>
              </div>
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
