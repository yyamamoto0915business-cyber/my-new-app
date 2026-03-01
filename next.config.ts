import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
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
    ],
  },
};

export default nextConfig;
