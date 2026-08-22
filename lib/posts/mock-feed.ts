/**
 * みんなの投稿（モック）
 */

export type PostCategory =
  | "event"
  | "shop"
  | "spot"
  | "kitchen"
  | "scenery";

export type PostMediaType = "image" | "video";

export type CommunityPost = {
  id: string;
  category: PostCategory;
  categoryLabel: string;
  title: string;
  body: string;
  mediaType?: PostMediaType;
  imageUrl: string;
  videoUrl?: string | null;
  durationSec?: number | null;
  /** 写真投稿の複数枚（1枚目は imageUrl と同じ） */
  galleryImages?: string[];
  authorId?: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  areaLabel: string;
  postedAtLabel: string;
  likeCount: number;
  likedByMe?: boolean;
  commentCount: number;
  relatedHref?: string;
  relatedLabel?: string;
  relatedTitle?: string;
  relatedImageUrl?: string;
  relatedSiteName?: string;
  tags: string[];
};

export const POST_CATEGORY_TABS = [
  { key: "all", label: "すべて" },
  { key: "event", label: "イベント" },
  { key: "shop", label: "お店" },
  { key: "spot", label: "スポット" },
  { key: "kitchen", label: "キッチンカー" },
  { key: "scenery", label: "風景・日常" },
] as const;

export type PostCategoryTab = (typeof POST_CATEGORY_TABS)[number]["key"];

export const POST_CATEGORY_COLORS: Record<PostCategory, string> = {
  event: "#2f7d4e",
  shop: "#c9a227",
  spot: "#2a9b8f",
  kitchen: "#d4843a",
  scenery: "#6b8cae",
};

/** 画像読み込み失敗時のフォールバック */
export const POST_CARD_FALLBACK_IMAGE =
  "https://placehold.co/800x600/e8dcc8/5a4a38?text=Post";

function mockPostImage(seed: string) {
  return `https://picsum.photos/seed/machiglyph-${seed}/800/600`;
}

export const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "p1",
    category: "event",
    categoryLabel: "イベント",
    title: "夏祭り、夜店の灯りが素敵だった",
    body: "近所の夏祭りへ。提灯の下で子どもたちが笑顔になっていて、まちの夏を感じました。",
    imageUrl: mockPostImage("post-p1"),
    authorName: "sora_87",
    authorAvatarUrl: null,
    areaLabel: "下北沢",
    postedAtLabel: "2時間前",
    likeCount: 128,
    commentCount: 14,
    relatedHref: "https://www.google.com/maps/search/?api=1&query=%E4%B8%8B%E5%8C%97%E6%B2%A2",
    relatedLabel: "マップで見る",
    tags: ["夏祭り", "夜店"],
  },
  {
    id: "p2",
    category: "shop",
    categoryLabel: "お店",
    title: "このカフェのラテアートが毎回楽しみ",
    body: "木漏れ日の窓辺でいただくショートケーキとラテ。休日の朝にぴったりです。",
    imageUrl: mockPostImage("post-p2"),
    authorName: "cafe_love",
    authorAvatarUrl: null,
    areaLabel: "吉祥寺",
    postedAtLabel: "5時間前",
    likeCount: 96,
    commentCount: 8,
    relatedHref: "https://example.com/cafe",
    relatedLabel: "サイトを開く",
    relatedTitle: "木漏れ日のカフェ",
    relatedSiteName: "example.com",
    tags: ["カフェ巡り"],
  },
  {
    id: "p3",
    category: "spot",
    categoryLabel: "スポット",
    title: "公園の芝生で、ひと息",
    body: "青空の下でお弁当。週末の午後は、ここでゆっくり過ごすのがいちばん好きです。",
    imageUrl: mockPostImage("post-p3"),
    authorName: "midori_walk",
    authorAvatarUrl: null,
    areaLabel: "代々木",
    postedAtLabel: "昨日",
    likeCount: 74,
    commentCount: 5,
    tags: ["公園"],
  },
  {
    id: "p4",
    category: "kitchen",
    categoryLabel: "キッチンカー",
    title: "マルシェのキッチンカーが並んでいた",
    body: "香りにつられて並びました。地元の野菜を使ったメニューがやさしい味でした。",
    imageUrl: mockPostImage("post-p4"),
    authorName: "foodie_tokyo",
    authorAvatarUrl: null,
    areaLabel: "自由が丘",
    postedAtLabel: "昨日",
    likeCount: 61,
    commentCount: 11,
    tags: ["グルメ", "マルシェ"],
  },
  {
    id: "p5",
    category: "scenery",
    categoryLabel: "風景・日常",
    title: "夕方の商店街がきれい",
    body: "帰りがけに見た商店街の灯り。日常の景色なのに、ちょっと特別に感じました。",
    imageUrl: mockPostImage("post-p5"),
    authorName: "evening_light",
    authorAvatarUrl: null,
    areaLabel: "鎌倉",
    postedAtLabel: "2日前",
    likeCount: 143,
    commentCount: 19,
    tags: ["風景"],
  },
  {
    id: "p6",
    category: "event",
    categoryLabel: "イベント",
    title: "手作り市で出会った器",
    body: "作家さんの器を手に取りました。会話も楽しくて、また来たいと思います。",
    imageUrl: mockPostImage("post-p6"),
    authorName: "mono_to",
    authorAvatarUrl: null,
    areaLabel: "清澄白河",
    postedAtLabel: "3日前",
    likeCount: 52,
    commentCount: 3,
    relatedHref: "https://www.google.com/maps/search/?api=1&query=%E6%B8%85%E6%BE%84%E7%99%BD%E6%B2%B3",
    relatedLabel: "マップで見る",
    tags: ["手作り市"],
  },
  {
    id: "p7",
    category: "shop",
    categoryLabel: "お店",
    title: "八百屋さんの季節野菜が彩り豊か",
    body: "店先に並ぶトマトとハーブ。今日の夕飯のメニューが決まりました。",
    imageUrl: mockPostImage("post-p7"),
    authorName: "vege_note",
    authorAvatarUrl: null,
    areaLabel: "三軒茶屋",
    postedAtLabel: "3日前",
    likeCount: 39,
    commentCount: 2,
    relatedHref: "https://example.com/yaoya",
    relatedLabel: "サイトを開く",
    tags: ["グルメ"],
  },
  {
    id: "p8",
    category: "spot",
    categoryLabel: "スポット",
    title: "小さな神社の静けさが好き",
    body: "参道の木漏れ日がやさしくて、歩くだけで気持ちが整います。",
    imageUrl: mockPostImage("post-p8"),
    authorName: "quiet_path",
    authorAvatarUrl: null,
    areaLabel: "世田谷",
    postedAtLabel: "4日前",
    likeCount: 88,
    commentCount: 7,
    tags: ["スポット"],
  },
];

export const MOCK_POPULAR_AREAS = [
  "下北沢",
  "吉祥寺",
  "鎌倉",
  "自由が丘",
  "清澄白河",
  "三軒茶屋",
];

export const MOCK_POPULAR_TAGS = [
  "#カフェ巡り",
  "#公園",
  "#グルメ",
  "#夏祭り",
  "#風景",
  "#マルシェ",
];

export function filterCommunityPosts(
  posts: CommunityPost[],
  category: PostCategoryTab,
  query = "",
): CommunityPost[] {
  const q = query.trim().toLowerCase();
  return posts.filter((post) => {
    if (category !== "all" && post.category !== category) return false;
    if (!q) return true;
    const hay =
      `${post.title} ${post.body} ${post.areaLabel} ${post.tags.join(" ")} ${post.authorName}`.toLowerCase();
    return hay.includes(q);
  });
}

export type PostSortKey = "popular" | "new" | "comments";
export type PostDateKey = "all" | "today" | "week" | "month";

export const POST_SORT_OPTIONS: { key: PostSortKey; label: string }[] = [
  { key: "popular", label: "人気順" },
  { key: "new", label: "新着順" },
  { key: "comments", label: "コメントが多い順" },
];

export const POST_DATE_OPTIONS: { key: PostDateKey; label: string }[] = [
  { key: "all", label: "すべての期間" },
  { key: "today", label: "今日" },
  { key: "week", label: "今週" },
  { key: "month", label: "今月" },
];

/** 「2時間前」「昨日」「3日前」などのラベルを、おおよその経過日数に変換する */
export function parsePostedDaysAgo(label: string): number {
  if (!label) return Number.POSITIVE_INFINITY;
  if (
    label.includes("今日") ||
    label.includes("たった今") ||
    label.includes("分前") ||
    label.includes("時間前")
  ) {
    return 0;
  }
  if (label.includes("昨日")) return 1;
  const m = label.match(/(\d+)\s*(日|週間|ヶ月|か月|カ月|年)前/);
  if (m) {
    const n = Number(m[1]);
    switch (m[2]) {
      case "日":
        return n;
      case "週間":
        return n * 7;
      case "ヶ月":
      case "か月":
      case "カ月":
        return n * 30;
      case "年":
        return n * 365;
    }
  }
  return Number.POSITIVE_INFINITY;
}

/** 投稿一覧から選択できるエリア一覧（重複除去） */
export function collectPostAreas(posts: CommunityPost[]): string[] {
  return Array.from(new Set(posts.map((p) => p.areaLabel).filter(Boolean)));
}

/** カテゴリ / エリア / 並び順 / 投稿日 をまとめて適用する */
export function applyPostFilters(
  posts: CommunityPost[],
  opts: {
    category?: PostCategoryTab;
    area?: string | null;
    sort?: PostSortKey;
    date?: PostDateKey;
    query?: string;
  } = {},
): CommunityPost[] {
  const {
    category = "all",
    area = null,
    sort = "popular",
    date = "all",
    query = "",
  } = opts;

  let list = filterCommunityPosts(posts, category, query);

  if (area) {
    list = list.filter((post) => post.areaLabel === area);
  }

  if (date !== "all") {
    list = list.filter((post) => {
      const days = parsePostedDaysAgo(post.postedAtLabel);
      if (date === "today") return days <= 0;
      if (date === "week") return days <= 7;
      if (date === "month") return days <= 31;
      return true;
    });
  }

  return list
    .map((post, index) => ({ post, index }))
    .sort((a, b) => {
      switch (sort) {
        case "new":
          return (
            parsePostedDaysAgo(a.post.postedAtLabel) -
              parsePostedDaysAgo(b.post.postedAtLabel) || a.index - b.index
          );
        case "comments":
          return b.post.commentCount - a.post.commentCount || a.index - b.index;
        case "popular":
        default:
          return b.post.likeCount - a.post.likeCount || a.index - b.index;
      }
    })
    .map((entry) => entry.post);
}
