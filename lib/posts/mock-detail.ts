/**
 * 投稿詳細ページ用のモックデータ（クライアント安全 / サーバー専用モジュール非依存）
 * - コメントの初期シード
 * - 「この近くのしるし」関連投稿
 * - 「この場所について」場所情報
 */
import type { PostCommentView } from "@/lib/db/community-post-comments-types";
import { MOCK_COMMUNITY_POSTS, type CommunityPost } from "@/lib/posts/mock-feed";

type SeedComment = {
  authorName: string;
  body: string;
  likeCount: number;
  postedAtLabel: string;
};

const SEED_COMMENTS: Record<string, SeedComment[]> = {
  p5: [
    {
      authorName: "sora_87",
      body: "わかります…この時間の空気感、すごく好きです。",
      likeCount: 12,
      postedAtLabel: "2日前",
    },
    {
      authorName: "cafe_love",
      body: "この時間のベーカリー、ここの時間帯がいちばん香りがいいですよね。",
      likeCount: 8,
      postedAtLabel: "1日前",
    },
    {
      authorName: "quiet_path",
      body: "ライトの灯りがとても素敵…癒されます。",
      likeCount: 6,
      postedAtLabel: "1日前",
    },
  ],
  p1: [
    {
      authorName: "midori_walk",
      body: "夏祭りの提灯、ほんとうに風情がありますね。",
      likeCount: 9,
      postedAtLabel: "1時間前",
    },
    {
      authorName: "foodie_tokyo",
      body: "夜店のこの雰囲気、たまらないです！",
      likeCount: 5,
      postedAtLabel: "1時間前",
    },
  ],
  p2: [
    {
      authorName: "vege_note",
      body: "ラテアート毎回ちがうの楽しいですよね。",
      likeCount: 4,
      postedAtLabel: "3時間前",
    },
  ],
};

const DEFAULT_SEED_COMMENTS: SeedComment[] = [
  {
    authorName: "machi_no_hito",
    body: "素敵な一枚ですね。シェアありがとうございます！",
    likeCount: 3,
    postedAtLabel: "1日前",
  },
];

/** 投稿の初期表示コメント（シード）。live コメントとは別に UI で下に並べる */
export function getSeedComments(postId: string): PostCommentView[] {
  const seeds = SEED_COMMENTS[postId] ?? DEFAULT_SEED_COMMENTS;
  return seeds.map((seed, i) => ({
    id: `seed-${postId}-${i}`,
    authorName: seed.authorName,
    authorAvatarUrl: null,
    body: seed.body,
    likeCount: seed.likeCount,
    postedAtLabel: seed.postedAtLabel,
    createdAt: new Date(Date.now() - (i + 1) * 3600_000).toISOString(),
  }));
}

/** 「この近くのしるし」用の関連投稿（同エリア優先 → 同カテゴリ → その他） */
export function getNearbyPosts(post: CommunityPost, limit = 3): CommunityPost[] {
  const others = MOCK_COMMUNITY_POSTS.filter((p) => p.id !== post.id);
  const scored = others
    .map((p) => {
      let score = 0;
      if (p.areaLabel && p.areaLabel === post.areaLabel) score += 2;
      if (p.category === post.category) score += 1;
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score || b.post.likeCount - a.post.likeCount);
  return scored.slice(0, limit).map((s) => s.post);
}

export type PostPlaceInfo = {
  areaLabel: string;
  description: string;
};

/** 「この場所について」の説明文（ダミー） */
export function getPostPlaceInfo(post: CommunityPost): PostPlaceInfo {
  const area = post.areaLabel || "このまち";
  return {
    areaLabel: area,
    description: `歴史ある建物や個性豊かなお店が並ぶ、${area}の人気の界隈。`,
  };
}

/** 投稿者のフォロワー数（ダミー）。id から決まる安定値 */
export function getAuthorFollowerCount(post: CommunityPost): number {
  let hash = 0;
  for (const ch of post.id) hash = (hash * 31 + ch.charCodeAt(0)) % 100000;
  return 40 + (hash % 460);
}
