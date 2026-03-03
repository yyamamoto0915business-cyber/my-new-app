import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { MapBackground } from "@/components/MapBackground";
import { BrandIntro } from "@/components/brand-intro";
import { LanguageProvider } from "@/components/language-provider";
import { APP_NAME, APP_SUBTITLE, APP_TAGLINE1 } from "@/lib/brand-copy";
import { BottomNav } from "@/components/bottom-nav";
import { NotificationBell } from "@/components/notification-bell";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} - ${APP_SUBTITLE}`,
  description: APP_TAGLINE1,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;600;700&family=M+PLUS+1p:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-[var(--mg-paper)]">
        <LanguageProvider>
          <BrandIntro />
          <MapBackground />
          <div className="fixed right-4 top-4 z-50 md:right-6 md:top-6">
            <Suspense fallback={null}>
              <NotificationBell />
            </Suspense>
          </div>
          <div className="min-h-screen pb-[calc(72px+env(safe-area-inset-bottom,0px))] md:pb-0 md:pl-20">
            {children}
          </div>
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </LanguageProvider>
      </body>
    </html>
  );
}
