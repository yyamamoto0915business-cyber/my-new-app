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
import "./globals.css";
import { Geist, Klee_One, Noto_Serif_JP, Shippori_Mincho } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

// アルバムのキャプション用（手書き楷書系）
const kleeOne = Klee_One({
  weight: ['400', '600'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-klee',
});

const notoSerifJP = Noto_Serif_JP({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-serif-jp',
});

const shipporiMincho = Shippori_Mincho({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-shippori-mincho',
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.machiglyph.jp";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${APP_NAME} - ${APP_SUBTITLE}`,
  description: APP_TAGLINE1,
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/brand/machiglyph_favicon_v2.ico", type: "image/x-icon" },
      { url: "/brand/favicon-32-v3.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/machiglyph_mark.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon.png",
    shortcut: "/brand/machiglyph_favicon_v2.ico",
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
    <html lang="ja" className={cn("font-sans", geist.variable, notoSerifJP.variable, shipporiMincho.variable, kleeOne.variable)}>
      <body className="font-sans antialiased min-h-screen bg-[#f3f4f1]">
        <LanguageProvider>
          <AbortErrorRecovery />
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
