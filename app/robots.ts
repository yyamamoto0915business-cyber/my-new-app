import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.machiglyph.jp";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    disallow: [
      "/api/",
      "/organizer/",
      "/profile/",
      "/messages/",
      "/dm/",
      "/notifications/",
      "/report/",
      "/auth",
      "/login",
      "/signup",
      "/onboarding",
      "/event-requests/",
    ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
