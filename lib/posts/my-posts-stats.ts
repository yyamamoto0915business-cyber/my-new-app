import type { MyPostItem } from "@/app/api/me/posts/route";
import type { PostCategory } from "@/lib/posts/mock-feed";

export type MyPostsCategoryCount = {
  category: PostCategory;
  label: string;
  count: number;
};

export type MyPostsStats = {
  publishedTotal: number;
  thisMonth: number;
  lastMonth: number;
  byCategory: MyPostsCategoryCount[];
};

const TZ = "Asia/Tokyo";

/** 日本時間での "YYYY-MM" を返す */
function toYearMonth(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
  }).format(new Date(iso));
}

function shiftYearMonth(base: Date, monthOffset: number): string {
  const y = Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric" }).format(
      base,
    ),
  );
  const m = Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, month: "2-digit" }).format(
      base,
    ),
  );
  const d = new Date(Date.UTC(y, m - 1 + monthOffset, 1));
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

/** 公開済み投稿から総数・今月・先月の件数を集計 */
export function computeMyPostsStats(
  posts: MyPostItem[],
  now: Date = new Date(),
): MyPostsStats {
  const published = posts.filter((p) => p.status === "public");
  const thisYm = shiftYearMonth(now, 0);
  const lastYm = shiftYearMonth(now, -1);

  let thisMonth = 0;
  let lastMonth = 0;
  const counts = new Map<PostCategory, MyPostsCategoryCount>();
  for (const post of published) {
    const ym = toYearMonth(post.createdAt);
    if (ym === thisYm) thisMonth += 1;
    else if (ym === lastYm) lastMonth += 1;

    const existing = counts.get(post.category);
    if (existing) existing.count += 1;
    else
      counts.set(post.category, {
        category: post.category,
        label: post.categoryLabel,
        count: 1,
      });
  }

  return {
    publishedTotal: published.length,
    thisMonth,
    lastMonth,
    byCategory: [...counts.values()].sort((a, b) => b.count - a.count),
  };
}
