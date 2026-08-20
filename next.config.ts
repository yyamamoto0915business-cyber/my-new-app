import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  compress: true,
  async redirects() {
    return [
      { source: "/rankings", destination: "/discover?tab=ranking", permanent: false },
      { source: "/read", destination: "/stories", permanent: true },
      { source: "/read/:path*", destination: "/stories/:path*", permanent: true },
      { source: "/organizer/articles", destination: "/organizer/stories", permanent: true },
      { source: "/organizer/articles/:path*", destination: "/organizer/stories/:path*", permanent: true },
      // ボランティア一覧はまちの情報ハブへ（詳細 /volunteer/:id は残す）
      { source: "/volunteer", destination: "/?kind=volunteer", permanent: false },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
        pathname: "/**",
      },
      // env 未読込時でも Supabase Storage 画像を許可（主催者アイコン等）
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      ...(() => {
        try {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (!url || typeof url !== "string" || url.trim() === "") return [];
          const hostname = new URL(url).hostname;
          if (!hostname) return [];
          return [
            {
              protocol: "https" as const,
              hostname,
              pathname: "/storage/v1/object/public/**",
            },
          ];
        } catch {
          return [];
        }
      })(),
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  /** SENTRY_AUTH_TOKEN が無いローカルビルドでは自動でスキップされる */
  silent: !process.env.CI,
  /** _next/static 配下のチャンクもソースマップ対象に含める（スタックの行番号が TS 側で解決される） */
  widenClientFileUpload: true,
});
