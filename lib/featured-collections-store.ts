/** 特集の一時ストア（開発用・インメモリ） */
export type FeaturedCollection = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  eventIds: string[];
  createdAt: string;
  updatedAt: string;
};

const collections: FeaturedCollection[] = [
  {
    id: "fc-1",
    slug: "weekend-free",
    title: "今週末の無料イベント",
    description: "今週末に開催される無料イベントをピックアップ",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    sortOrder: 1,
    eventIds: ["1", "4", "6"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "fc-2",
    slug: "culture-experience",
    title: "地域の文化体験",
    description: "和の文化に触れる体験イベント",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
    sortOrder: 2,
    eventIds: ["2", "3", "5"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "fc-3",
    slug: "kids-friendly",
    title: "子連れOK特集",
    description: "お子様と一緒に楽しめるイベント",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
    sortOrder: 3,
    eventIds: ["1", "2", "4", "6"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getAllCollections(): FeaturedCollection[] {
  return [...collections].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCollectionBySlug(slug: string): FeaturedCollection | null {
  return collections.find((c) => c.slug === slug) ?? null;
}
