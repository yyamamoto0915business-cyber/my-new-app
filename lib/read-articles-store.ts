/**
 * 読みもの記事（/read, /organizer/articles）用ストア
 * MVP: インメモリ。のちに Supabase/API に差し替え可能なインターフェース
 */
import type { ReadArticle, ArticleBlock, ArticleStatus } from "./read-article-types";
import { slugFromTitle } from "./read-article-types";

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200",
];

const dummyBlocks: ArticleBlock[] = [
  { type: "heading", text: "この特集について" },
  {
    type: "paragraph",
    text: "地域の秋を楽しむイベントをまとめた特集です。フリマ、ワークショップ、コンサートなど、週末の予定にぴったりの企画を厳選しました。",
  },
  { type: "heading", text: "注目のポイント" },
  {
    type: "paragraph",
    text: "今年は初の試みとして、複数会場を巡るスタンプラリーを実施します。3つ以上回ると抽選でプレゼントが当たる企画もご用意しています。",
  },
  {
    type: "timeline",
    items: [
      { time: "10:00", text: "受付開始" },
      { time: "10:30", text: "オープニング" },
      { time: "15:00", text: "クロージング" },
    ],
  },
  { type: "heading", text: "よくある質問" },
  {
    type: "qa",
    items: [
      { q: "雨天の場合は？", a: "小雨決行です。荒天の場合は前日に告知します。" },
      { q: "駐車場はありますか？", a: "会場周辺の有料駐車場をご利用ください。" },
    ],
  },
  { type: "eventEmbed", eventIds: ["1", "2"] },
];

const articles: ReadArticle[] = [
  {
    id: "read-1",
    slug: "aki-no-ivent-matsuri",
    title: "秋のイベントまつり特集",
    lead: "地域の秋を楽しむイベントを一挙紹介。フリマ、ワークショップ、ライブまで、週末の予定にぴったりの企画を厳選しました。",
    coverImageUrl: COVER_IMAGES[0],
    tags: ["特集", "秋", "週末"],
    status: "published",
    templateType: "feature",
    authorId: "org-1",
    authorName: "地域振興会",
    blocks: dummyBlocks,
    createdAt: "2025-02-01T10:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "read-2",
    slug: "fureai-furima-no-omoi",
    title: "ふれあいフリマに込めた想い",
    lead: "主催者インタビュー。地域住民の交流の場として続けてきたフリマの背景と、これから参加する方へのメッセージをお届けします。",
    coverImageUrl: COVER_IMAGES[1],
    tags: ["インタビュー", "主催者", "フリマ"],
    status: "published",
    templateType: "interview",
    authorId: "org-1",
    authorName: "地域振興会",
    blocks: [
      { type: "heading", text: "主催者について" },
      {
        type: "paragraph",
        text: "私たちは地域のつながりを大切に、年に数回フリーマーケットを開催しています。",
      },
      { type: "heading", text: "イベントに込めた想い" },
      {
        type: "paragraph",
        text: "掘り出し物を探す楽しみだけでなく、知らない人との会話や子どもたちの笑顔が、何よりの財産だと考えています。",
      },
      { type: "eventEmbed", eventIds: ["1"] },
    ],
    createdAt: "2025-02-08T14:30:00Z",
    updatedAt: "2025-02-08T14:30:00Z",
  },
  {
    id: "read-3",
    slug: "tougei-taiken-report",
    title: "陶芸体験に参加して",
    lead: "初めての陶芸体験に参加したレポート。先生の丁寧な指導で、思い出に残る茶碗ができました。当日の流れと感想をお伝えします。",
    coverImageUrl: COVER_IMAGES[2],
    tags: ["参加レポ", "陶芸", "ワークショップ"],
    status: "published",
    templateType: "report",
    authorId: "user-1",
    authorName: "参加者",
    blocks: [
      { type: "heading", text: "参加のきっかけ" },
      { type: "paragraph", text: "ずっと興味があった陶芸を、気軽に体験できる機会だと知り申し込みました。" },
      { type: "heading", text: "当日の様子" },
      { type: "paragraph", text: "成形から色付けまで約2時間。自分で作った器でお茶を飲む日が楽しみです。" },
      { type: "eventEmbed", eventIds: ["3"] },
    ],
    createdAt: "2025-02-15T09:00:00Z",
    updatedAt: "2025-02-15T09:00:00Z",
  },
];

const slugToId = new Map<string, string>();
articles.forEach((a) => {
  if (a.status === "published") slugToId.set(a.slug, a.id);
});

let nextId = 1000;

function ensureUniqueSlug(slug: string, excludeId?: string): string {
  let s = slug || "untitled";
  let n = 0;
  while (true) {
    const candidate = n === 0 ? s : `${s}-${n}`;
    const existing = articles.find((a) => a.slug === candidate && a.id !== excludeId);
    if (!existing) return candidate;
    n += 1;
  }
}

/** 公開記事一覧（/read 用） */
export function getPublishedArticles(): ReadArticle[] {
  return articles
    .filter((a) => a.status === "published")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** slug で記事取得（公開のみ or 自著は下書きも） */
export function getArticleBySlug(
  slug: string,
  options?: { includeDraftForAuthorId?: string }
): ReadArticle | null {
  const bySlug = articles.find((a) => a.slug === slug);
  if (!bySlug) return null;
  if (bySlug.status === "published") return bySlug;
  if (options?.includeDraftForAuthorId && bySlug.authorId === options.includeDraftForAuthorId)
    return bySlug;
  return null;
}

/** id で記事取得 */
export function getArticleById(id: string): ReadArticle | null {
  return articles.find((a) => a.id === id) ?? null;
}

/** 主催者（authorId）の記事一覧（下書き・公開両方） */
export function getArticlesByAuthor(authorId: string): ReadArticle[] {
  return articles
    .filter((a) => a.authorId === authorId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** 記事作成 */
export function createArticle(data: {
  title: string;
  lead: string;
  coverImageUrl: string;
  tags: string[];
  templateType: ReadArticle["templateType"];
  authorId: string;
  authorName: string;
  blocks: ArticleBlock[];
  status?: ArticleStatus;
}): ReadArticle {
  const id = `read-${nextId++}`;
  const slug = ensureUniqueSlug(slugFromTitle(data.title));
  const now = new Date().toISOString();
  const article: ReadArticle = {
    id,
    slug,
    title: data.title,
    lead: data.lead,
    coverImageUrl: data.coverImageUrl,
    tags: data.tags ?? [],
    status: data.status ?? "draft",
    templateType: data.templateType,
    authorId: data.authorId,
    authorName: data.authorName,
    blocks: data.blocks ?? [],
    createdAt: now,
    updatedAt: now,
  };
  articles.push(article);
  return article;
}

/** 記事更新 */
export function updateArticle(
  id: string,
  updates: Partial<Pick<ReadArticle, "title" | "lead" | "coverImageUrl" | "tags" | "blocks" | "status">>
): ReadArticle | null {
  const idx = articles.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  const prev = articles[idx];
  const slug =
    updates.title !== undefined
      ? ensureUniqueSlug(slugFromTitle(updates.title), id)
      : prev.slug;
  articles[idx] = {
    ...prev,
    ...updates,
    slug: updates.title !== undefined ? slug : prev.slug,
    updatedAt: new Date().toISOString(),
  };
  return articles[idx];
}

/** 公開する */
export function publishArticle(id: string): ReadArticle | null {
  return updateArticle(id, { status: "published" });
}
