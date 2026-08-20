import type { MyPostItem } from "@/app/api/me/posts/route";

export type MyPostMonthGroup = {
  key: string;
  label: string;
  posts: MyPostItem[];
};

const TZ = "Asia/Tokyo";

/** 「2026.08.10」形式（日本時間固定） */
export function formatPostDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
}

/** 投稿を年月ごとにまとめ、新しい月・新しい投稿が先頭に来るよう並べる */
export function groupMyPostsByMonth(posts: MyPostItem[]): MyPostMonthGroup[] {
  const map = new Map<string, MyPostItem[]>();

  for (const post of posts) {
    const ym = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
    }).format(new Date(post.createdAt));
    const list = map.get(ym);
    if (list) list.push(post);
    else map.set(ym, [post]);
  }

  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, list]) => {
      const [year, month] = key.split("-");
      return {
        key,
        label: `${year}年${Number(month)}月`,
        posts: list.sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
        ),
      };
    });
}
