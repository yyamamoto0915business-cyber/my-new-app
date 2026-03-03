import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/rankings", destination: "/discover?tab=ranking", permanent: false },
      { source: "/read", destination: "/stories", permanent: true },
      { source: "/read/:path*", destination: "/stories/:path*", permanent: true },
      { source: "/organizer/articles", destination: "/organizer/stories", permanent: true },
      { source: "/organizer/articles/:path*", destination: "/organizer/stories/:path*", permanent: true },
    ];
  },
  images: {
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
        hostname: "i.imgur.com",
        pathname: "/**",
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
};

export default nextConfig;
