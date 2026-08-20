import type { MyPostItem } from "@/app/api/me/posts/route";

export type SeasonKey = "spring" | "summer" | "autumn" | "winter";

export type SeasonMeta = {
  key: SeasonKey;
  label: string;
  months: string;
  range: string;
  en: string;
};

/** 季節の定義。冬は「前年12月＋当年1・2月」で扱う */
export const SEASONS: SeasonMeta[] = [
  { key: "spring", label: "春", months: "3月・4月・5月", range: "3-5月", en: "SPRING" },
  { key: "summer", label: "夏", months: "6月・7月・8月", range: "6-8月", en: "SUMMER" },
  { key: "autumn", label: "秋", months: "9月・10月・11月", range: "9-11月", en: "AUTUMN" },
  { key: "winter", label: "冬", months: "12月・1月・2月", range: "12-2月", en: "WINTER" },
];

/** 月別アーカイブの並び順（春→冬。冬の12月は前年扱い） */
export const ARCHIVE_MONTH_ORDER = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2] as const;

export type SeasonAlbum = Record<SeasonKey, MyPostItem[]>;

const TZ = "Asia/Tokyo";

/**
 * マイアルバムに残す投稿か。
 * 非公開（hidden）は「みんなの投稿」から外れるだけで、アルバムには残す。
 * 下書き（draft）だけは別管理なのでアルバム本体には含めない。
 */
function isAlbumVisible(post: MyPostItem): boolean {
  return post.status !== "draft";
}

function ymOf(iso: string): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(iso));
  const year = Number(parts.find((p) => p.type === "year")?.value ?? "0");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "0");
  return { year, month };
}

/** 月 → 季節。12月は前年冬なので albumYear は month で補正して算出する */
function seasonOfMonth(month: number): SeasonKey {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter"; // 12, 1, 2
}

/** 投稿日時から季節を返す */
export function seasonOfPost(iso: string): SeasonKey {
  return seasonOfMonth(ymOf(iso).month);
}

/** 投稿が属する「アルバム年」。12月は翌年の冬に属する */
export function albumYearOf(iso: string): number {
  const { year, month } = ymOf(iso);
  return month === 12 ? year + 1 : year;
}

function emptyAlbum(): SeasonAlbum {
  return { spring: [], summer: [], autumn: [], winter: [] };
}

/** アルバム掲載投稿（公開＋非公開）を「年 → 季節 → 投稿[]」にまとめる */
export function buildSeasonAlbums(
  posts: MyPostItem[],
): Map<number, SeasonAlbum> {
  const map = new Map<number, SeasonAlbum>();
  for (const post of posts) {
    if (!isAlbumVisible(post)) continue;
    const { month } = ymOf(post.createdAt);
    const year = albumYearOf(post.createdAt);
    const season = seasonOfMonth(month);
    let album = map.get(year);
    if (!album) {
      album = emptyAlbum();
      map.set(year, album);
    }
    album[season].push(post);
  }
  // 各季節を新しい順に
  for (const album of map.values()) {
    for (const key of Object.keys(album) as SeasonKey[]) {
      album[key].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
  }
  return map;
}

/** 投稿が存在するアルバム年の一覧（新しい順） */
export function listAlbumYears(posts: MyPostItem[]): number[] {
  const years = new Set<number>();
  for (const post of posts) {
    if (!isAlbumVisible(post)) continue;
    years.add(albumYearOf(post.createdAt));
  }
  return [...years].sort((a, b) => b - a);
}

/** 指定年に属するアルバム掲載投稿（公開＋非公開）を抽出（新しい順） */
export function postsForYear(
  posts: MyPostItem[],
  year: number,
): MyPostItem[] {
  return posts
    .filter((p) => isAlbumVisible(p) && albumYearOf(p.createdAt) === year)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

/** 指定年の月別件数（キーは暦上の月 1-12） */
export function monthCountsForYear(
  posts: MyPostItem[],
  year: number,
): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const post of postsForYear(posts, year)) {
    const { month } = ymOf(post.createdAt);
    counts[month] = (counts[month] ?? 0) + 1;
  }
  return counts;
}

/** 月キー（YYYY-MM）を作る。アーカイブのスクロール用 */
export function monthKeyForYear(year: number, month: number): string {
  // 12月は前年の暦
  const calYear = month === 12 ? year - 1 : year;
  return `${calYear}-${String(month).padStart(2, "0")}`;
}

/** ISO文字列から暦上の月キー（YYYY-MM）を返す（groupMyPostsByMonth と同形式） */
export function calendarMonthKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
  }).format(new Date(iso));
}
