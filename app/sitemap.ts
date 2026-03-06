import type { MetadataRoute } from "next";
import { getEvents } from "@/lib/events";
import { getPublishedArticles } from "@/lib/read-articles-store";
import { getPublishedStories } from "@/lib/stories-store";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.machiglyph.jp";

export default function sitemap(): MetadataRoute.Sitemap {
  const events = getEvents();
  const articles = getPublishedArticles();
  const stories = getPublishedStories();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/events`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/discover`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/volunteer`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/recruitments`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/read`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/stories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/collections`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/articles`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/rankings`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  const eventRoutes: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${BASE}/events/${e.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE}/read/${a.slug}`,
    lastModified: new Date(a.updatedAt ?? a.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const storyRoutes: MetadataRoute.Sitemap = stories.map((s) => ({
    url: `${BASE}/stories/${s.slug}`,
    lastModified: new Date(s.updatedAt ?? s.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...eventRoutes, ...articleRoutes, ...storyRoutes];
}
