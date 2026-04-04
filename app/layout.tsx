import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { MapBackground } from "@/components/MapBackground";
import { BrandIntro } from "@/components/brand-intro";
import { LanguageProvider } from "@/components/language-provider";
import { APP_NAME, APP_SUBTITLE, APP_TAGLINE1 } from "@/lib/brand-copy";
import { BottomNav } from "@/components/bottom-nav";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileTopHeader } from "@/components/navigation/mobile-top-header";
import { MobileMainShell } from "@/components/navigation/mobile-main-shell";
import { ImmersiveAwareFooter } from "@/components/navigation/immersive-aware-footer";
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
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon-32-v3.png", sizes: "32x32" },
      { url: "/brand/favicon-48-v3.png", sizes: "48x48" },
    ],
    apple: "/brand/apple-touch-icon-v2.png",
    shortcut: "/brand/favicon-32-v3.png",
  },
  openGraph: {
    title: `${APP_NAME} - ${APP_SUBTITLE}`,
    description: APP_TAGLINE1,
    siteName: APP_NAME,
    type: "website",
    locale: "ja_JP",
    images: [
      {
        url: "/brand/icon-ogp.svg",
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
    images: ["/brand/icon-ogp.svg"],
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
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;600;700&family=M+PLUS+1p:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-[var(--mg-paper)]">
        <LanguageProvider>
          <BrandIntro />
          <MapBackground />
          <Suspense fallback={null}>
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
