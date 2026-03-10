import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { MapBackground } from "@/components/MapBackground";
import { BrandIntro } from "@/components/brand-intro";
import { LanguageProvider } from "@/components/language-provider";
import { APP_NAME, APP_SUBTITLE, APP_TAGLINE1 } from "@/lib/brand-copy";
import { BottomNav } from "@/components/bottom-nav";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ModeSegmentNav } from "@/components/mode-segment-nav";
import { NotificationBell } from "@/components/notification-bell";
import { UserMenu } from "@/components/header/UserMenu";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://my-new-app-self-iota.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${APP_NAME} - ${APP_SUBTITLE}`,
  description: APP_TAGLINE1,
  openGraph: {
    title: `${APP_NAME} - ${APP_SUBTITLE}`,
    description: APP_TAGLINE1,
    siteName: APP_NAME,
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - ${APP_SUBTITLE}`,
    description: APP_TAGLINE1,
  },
  alternates: {
    canonical: "./",
  },
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
    <html lang="ja" className={cn("font-sans", geist.variable)}>
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
          <div className="fixed right-4 top-4 z-50 flex items-center gap-2 md:right-6 md:top-6">
            <Suspense fallback={null}>
              <NotificationBell />
            </Suspense>
            <Suspense fallback={null}>
              <UserMenu />
            </Suspense>
          </div>
          <Suspense fallback={null}>
            <ModeSegmentNav />
          </Suspense>
          <div className="min-h-screen pb-[calc(72px+env(safe-area-inset-bottom,0px))] pt-[calc(48px+env(safe-area-inset-top,0px))] sm:pb-0 sm:pl-20 sm:pt-0">
            {children}
          </div>
          <Suspense fallback={null}>
            <MobileBottomNav />
            <BottomNav />
          </Suspense>
        </LanguageProvider>
      </body>
    </html>
  );
}
