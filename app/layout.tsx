import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-context"
import { OfflineProvider } from "@/components/offline-provider"
import { OfflineStatusBanner } from "@/components/offline-status-banner"
import { NotificationProvider } from "@/components/notification-provider"
import { AuthProvider } from "@/components/auth-provider"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "SMART MINE",
  description: "Enterprise Mining Operations Platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("h-full antialiased", "font-sans", geist.variable)}>
      <body suppressHydrationWarning className={`${geist.className} min-h-screen flex flex-col overflow-hidden`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
              <OfflineProvider>
                <NotificationProvider>
                  <div className="flex bg-background h-screen w-[100vw] font-sans overflow-hidden">
                    <LayoutWrapper>
                      {children}
                    </LayoutWrapper>
                  </div>
                <OfflineStatusBanner />
              </NotificationProvider>
            </OfflineProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
