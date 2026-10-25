import type { CommunityPost } from "@/lib/posts/mock-feed";

/**
 * 住所っぽい場所ラベルを「笛吹市」「美瑛町」のような短い地名にする
 * 例: "山梨県・山梨県笛吹市石和町市部822" → "笛吹市"
 */
export function shortAreaLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "";
  const last = trimmed.split(/[・･·/／]/).pop()?.trim() || trimmed;
  const m = last.match(/^(?:.+?[都道府県])?(.+?[市区町村])/);
  if (m?.[1]) return m[1];
  return last.length > 10 ? `${last.slice(0, 10)}…` : last;
}

/** エリア絞り込み：元のラベルでも短い地名でも一致させる */
export function postMatchesArea(post: CommunityPost, area: string): boolean {
  if (!area) return true;
  return post.areaLabel === area || shortAreaLabel(post.areaLabel) === area;
}

/** タグを使われている数の多い順に（先頭に # を付けて）返す */
export function collectPopularTags(posts: CommunityPost[], limit = 6): string[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      const key = tag.startsWith("#") ? tag : `#${tag}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .slice(0, limit)
    .map(([tag]) => tag);
}
