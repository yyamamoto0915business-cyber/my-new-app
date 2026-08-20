import type { MyPostItem } from "@/app/api/me/posts/route";

let inflight: Promise<MyPostItem[] | null> | null = null;
let cached: MyPostItem[] | null = null;

/** マイアルバム表示前に投稿一覧を先読み（ボトムナビのタップ直前など） */
export function prefetchMyPosts(): Promise<MyPostItem[] | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = fetch("/api/me/posts", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items?: MyPostItem[] }) => {
        cached = Array.isArray(data.items) ? data.items : [];
        return cached;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** 先読み済みデータがあれば返す（なければ null） */
export function getPrefetchedMyPosts(): MyPostItem[] | null {
  return cached;
}

export function resetMyPostsPrefetch() {
  inflight = null;
  cached = null;
}
