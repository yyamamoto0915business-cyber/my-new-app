import type { MyPostItem } from "@/app/api/me/posts/route";
import {
  albumDateOf,
  albumYearOf,
  seasonOfPost,
  type SeasonKey,
} from "@/lib/posts/group-my-posts-by-season";
import { parsePostBodyExtras } from "@/lib/posts/post-create-draft";
import type { PostCategory } from "@/lib/posts/mock-feed";
import { demoDetailFor } from "@/lib/posts/my-posts-demo";

export type AlbumHubTab = "posts" | "album" | "map";
export type AlbumSeasonFilter = "all" | SeasonKey;
export type AlbumCategoryFilter = "all" | PostCategory;
export type AlbumSortKey = "new" | "old" | "likes";
export type AlbumStatusFilter = "all" | "public" | "hidden" | "draft";

export function tagsForMyPost(post: MyPostItem): string[] {
  if (post.tags && post.tags.length > 0) return post.tags;
  if (post.body) {
    const extras = parsePostBodyExtras(post.body);
    if (extras.tags.length > 0) return extras.tags;
  }
  return demoDetailFor(post.id)?.tags ?? [];
}

export function areaForMyPost(post: MyPostItem): string {
  const own = post.areaLabel?.trim();
  if (own) return own;
  return demoDetailFor(post.id)?.areaLabel ?? "";
}

export function handleFromEmail(email?: string | null): string | null {
  const local = email?.split("@")[0]?.trim();
  if (!local) return null;
  return local.toLowerCase();
}

export function filterAlbumPosts(
  posts: MyPostItem[],
  opts: {
    season: AlbumSeasonFilter;
    category: AlbumCategoryFilter;
    year: number | "all";
    status: AlbumStatusFilter;
    sort: AlbumSortKey;
    tag?: string | null;
    includeDrafts?: boolean;
  },
): MyPostItem[] {
  let list = posts.filter((post) => {
    if (opts.status === "all") {
      if (!opts.includeDrafts && post.status === "draft") return false;
    } else if (post.status !== opts.status) {
      return false;
    }
    if (opts.year !== "all" && albumYearOf(albumDateOf(post)) !== opts.year) {
      return false;
    }
    if (
      opts.season !== "all" &&
      seasonOfPost(albumDateOf(post)) !== opts.season
    ) {
      return false;
    }
    if (opts.category !== "all" && post.category !== opts.category) {
      return false;
    }
    if (opts.tag && !tagsForMyPost(post).includes(opts.tag)) return false;
    return true;
  });

  list = [...list].sort((a, b) => {
    if (opts.sort === "likes") {
      return b.likeCount - a.likeCount || +new Date(b.createdAt) - +new Date(a.createdAt);
    }
    const byDate =
      +new Date(albumDateOf(a)) - +new Date(albumDateOf(b)) ||
      +new Date(a.createdAt) - +new Date(b.createdAt);
    return opts.sort === "old" ? byDate : -byDate;
  });

  return list;
}

export function collectAlbumTags(
  posts: MyPostItem[],
): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of tagsForMyPost(post)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ja"));
}

export function collectAlbumAreas(
  posts: MyPostItem[],
): { area: string; count: number; preview: MyPostItem }[] {
  const map = new Map<string, MyPostItem[]>();
  for (const post of posts) {
    const area = areaForMyPost(post);
    if (!area) continue;
    const list = map.get(area) ?? [];
    list.push(post);
    map.set(area, list);
  }
  return [...map.entries()]
    .map(([area, list]) => ({
      area,
      count: list.length,
      preview: list[0],
    }))
    .sort((a, b) => b.count - a.count || a.area.localeCompare(b.area, "ja"));
}
