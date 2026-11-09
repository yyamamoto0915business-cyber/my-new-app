import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { MapBackground } from "@/components/MapBackground";
import { SplashScreen } from "@/components/SplashScreen";
import { LanguageProvider } from "@/components/language-provider";
import { APP_NAME, APP_SUBTITLE, APP_TAGLINE1 } from "@/lib/brand-copy";
import { BottomNav } from "@/components/bottom-nav";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileTopHeader } from "@/components/navigation/mobile-top-header";
import { MobileMainShell } from "@/components/navigation/mobile-main-shell";
import { PcTopNav } from "@/components/navigation/pc-top-nav";
import { ImmersiveAwareFooter } from "@/components/navigation/immersive-aware-footer";
import { OrganizerProGlobalSyncer } from "@/components/organizer/OrganizerProGlobalSyncer";
import { AbortErrorRecovery } from "@/components/abort-error-recovery";
import { NativeAppBridge } from "@/components/native/NativeAppBridge";
import { PushRegistration } from "@/components/native/PushRegistration";
import "./globals.css";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

/*
 * フォント：ビルドのたびに Google から取りに行くと、つながらないときにビルドが止まる。
 * - 英字の Geist はファイルを置いて読む
 * - 日本語（明朝・手書き）は文字の範囲ごとに数百のファイルに分かれていて重いので、
 *   ビルドでは取らず、画面を開いたときにブラウザが Google Fonts から読む（<head> の link）。
 *   名前は globals.css の --font-noto-serif-jp などに入れてある。
 */
const geist = localFont({
  src: "./fonts/geist-latin.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-sans",
});

const JP_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&family=Noto+Serif+JP:wght@400;500;600;700&family=Shippori+Mincho:wght@400;500;600&display=swap";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.machiglyph.jp";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${APP_NAME} - ${APP_SUBTITLE}`,
  description: APP_TAGLINE1,
  manifest: "/site.webmanifest",
  icons: {
    // アプリのアイコン（マスコット）にそろえる。タブの小さいアイコンは、分かるように顔と芽だけを切り抜いたもの
    icon: [
      { url: "/brand/mascot-favicon.ico", type: "image/x-icon" },
      { url: "/brand/mascot-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/mascot-favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/mascot-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/brand/mascot-apple-touch-icon.png",
    shortcut: "/brand/mascot-favicon.ico",
  },
  openGraph: {
    title: `${APP_NAME} - ${APP_SUBTITLE}`,
    description: APP_TAGLINE1,
    siteName: APP_NAME,
    type: "website",
    locale: "ja_JP",
    images: [
      {
        url: "/brand/machiglyph_ogp.png",
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - ${APP_SUBTITLE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - ${APP_SUBTITLE}`,
    description: APP_TAGLINE1,
    images: ["/brand/machiglyph_ogp.png"],
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
  themeColor: "#D94A1F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 日本語フォントはビルドで取らず、開いたときに読む（上のコメント） */}
        <link rel="stylesheet" href={JP_FONTS_HREF} />
      </head>
      <body className="font-sans antialiased min-h-screen-dvh bg-[#f3f4f1]">
        <LanguageProvider>
          <AbortErrorRecovery />
          <NativeAppBridge />
          <PushRegistration />
          <OrganizerProGlobalSyncer />
          <SplashScreen />
          <MapBackground />
          <Suspense fallback={null}>
            <PcTopNav />
            <MobileTopHeader />
          </Suspense>
          <MobileMainShell>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            <ImmersiveAwareFooter />
          </MobileMainShell>
          <Suspense fallback={null}>
            <MobileBottomNav />
            <BottomNav />
          </Suspense>
        </LanguageProvider>
      </body>
    </html>
  );
}
