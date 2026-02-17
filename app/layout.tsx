import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { BackgroundIllustration } from "@/components/background-illustration";
import { RegionFilterBar } from "@/components/region-filter-bar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "地域イベントプラットフォーム",
  description: "地域のイベントを探して参加しよう",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen`}
      >
        <BackgroundIllustration />
        <Suspense fallback={null}>
          <RegionFilterBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
