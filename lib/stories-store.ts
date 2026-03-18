/**
 * ストーリー用ストア（/stories, /organizer/stories, イベント紐づけ）
 * MVP: インメモリ。eventId / role でフィルタ可能。
 */
import type { Story, StoryBlock, StoryStatus, StoryRole, StoryPurpose } from "./story-types";
import { slugFromTitle } from "./story-types";

const COVERS = [
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200",
];

const stories: Story[] = [
  {
    id: "story-1",
    slug: "aki-no-ivent-matsuri",
    title: "秋のイベントまつり特集",
    lead: "地域の秋を楽しむイベントを一挙紹介。フリマ、ワークショップ、ライブまで、週末の予定にぴったりの企画を厳選しました。",
    coverImageUrl: COVERS[0],
    tags: ["特集", "秋", "週末"],
    role: "organizer",
    purpose: "promotion",
    status: "published",
    isSeed: true,
    authorId: "org-1",
    authorName: "地域振興会",
    eventId: "1",
    blocks: [
      { type: "heading", text: "どんなイベント？" },
      { type: "paragraph", text: "地域の秋を楽しむイベントをまとめた特集です。フリマ、ワークショップ、コンサートなど、週末の予定にぴったりの企画を厳選しました。" },
      { type: "heading", text: "見どころ" },
      { type: "bullets", items: ["スタンプラリー", "限定ノベルティ", "ライブ演奏"] },
      { type: "heading", text: "当日の流れ" },
      { type: "timeline", items: [{ time: "10:00", text: "受付開始" }, { time: "10:30", text: "オープニング" }, { time: "15:00", text: "クロージング" }] },
      { type: "heading", text: "初めての人へ（Q&A）" },
      { type: "qa", items: [{ q: "雨天の場合は？", a: "小雨決行です。" }, { q: "駐車場は？", a: "会場周辺の有料駐車場をご利用ください。" }] },
      { type: "heading", text: "主催者の想い" },
      { type: "paragraph", text: "地域のつながりを大切に、毎年開催しています。ぜひお越しください。" },
      { type: "eventEmbed", eventIds: ["1", "2"] },
    ],
    createdAt: "2025-02-01T10:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "story-2",
    slug: "fureai-furima-no-omoi",
    title: "ふれあいフリマに込めた想い",
    lead: "主催者ストーリー。地域住民の交流の場として続けてきたフリマの背景と、これから参加する方へのメッセージをお届けします。",
    coverImageUrl: COVERS[1],
    tags: ["主催者", "フリマ"],
    role: "organizer",
    purpose: "promotion",
    status: "published",
    isSeed: true,
    authorId: "org-1",
    authorName: "地域振興会",
    eventId: "1",
    blocks: [
      { type: "heading", text: "どんなイベント？" },
      { type: "paragraph", text: "地域のフリーマーケットです。掘り出し物と交流をお楽しみください。" },
      { type: "heading", text: "主催者の想い" },
      { type: "paragraph", text: "知らない人との会話や子どもたちの笑顔が、何よりの財産です。" },
      { type: "eventEmbed", eventIds: ["1"] },
    ],
    createdAt: "2025-02-08T14:30:00Z",
    updatedAt: "2025-02-08T14:30:00Z",
  },
  {
    id: "story-3",
    slug: "tougei-taiken-report",
    title: "陶芸体験に参加して",
    lead: "初めての陶芸体験に参加したレポ。先生の丁寧な指導で、思い出に残る茶碗ができました。",
    coverImageUrl: COVERS[2],
    tags: ["参加レポ", "陶芸"],
    role: "participant",
    purpose: "report",
    status: "published",
    isSeed: true,
    authorId: "user-1",
    authorName: "参加者",
    eventId: "3",
    blocks: [
      { type: "heading", text: "参加のきっかけ" },
      { type: "paragraph", text: "ずっと興味があった陶芸を、気軽に体験できる機会だと知り申し込みました。" },
      { type: "heading", text: "当日の様子" },
      { type: "paragraph", text: "成形から色付けまで約2時間。自分で作った器でお茶を飲む日が楽しみです。" },
      { type: "heading", text: "これから参加する人へ" },
      { type: "paragraph", text: "エプロンとタオルがあると便利です。初心者でも大丈夫です。" },
      { type: "rating", atmosphere: 5, physical: 2, recommend: 5 },
      { type: "eventEmbed", eventIds: ["3"] },
    ],
    createdAt: "2025-02-15T09:00:00Z",
    updatedAt: "2025-02-15T09:00:00Z",
  },
];

let nextId = 1000;

function ensureUniqueSlug(slug: string, excludeId?: string): string {
  let s = slug || "untitled";
  let n = 0;
  while (true) {
    const candidate = n === 0 ? s : `${s}-${n}`;
    const existing = stories.find((x) => x.slug === candidate && x.id !== excludeId);
    if (!existing) return candidate;
    n += 1;
  }
}

export function getPublishedStories(limit?: number): Story[] {
  const list = stories
    .filter((s) => s.status === "published" && s.isSeed !== true)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return limit ? list.slice(0, limit) : list;
}

export function getStoryBySlug(
  slug: string,
  options?: { includeDraftForAuthorId?: string; includeSeed?: boolean }
): Story | null {
  const s = stories.find((x) => x.slug === slug);
  if (!s) return null;
  if (s.isSeed === true && options?.includeSeed !== true) return null;
  if (s.status === "published") return s;
  if (options?.includeDraftForAuthorId && s.authorId === options.includeDraftForAuthorId)
    return s;
  return null;
}

export function getStoryById(id: string): Story | null {
  return stories.find((s) => s.id === id) ?? null;
}

export function getStoriesByAuthor(authorId: string): Story[] {
  return stories
    .filter((s) => s.authorId === authorId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** イベントに紐づくストーリー（role 指定で主催者 or レポ） */
export function getStoriesByEventId(
  eventId: string,
  options?: { role?: StoryRole; limit?: number }
): Story[] {
  let list = stories.filter(
    (s) => s.status === "published" && s.eventId === eventId && s.isSeed !== true
  );
  if (options?.role) list = list.filter((s) => s.role === options.role);
  list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return options?.limit ? list.slice(0, options.limit) : list;
}

/** 主催者ストーリー 1件（宣伝用） */
export function getOrganizerStoryForEvent(eventId: string): Story | null {
  const list = getStoriesByEventId(eventId, { role: "organizer", limit: 1 });
  return list[0] ?? null;
}

/** みんなのレポ（ボラ・スタッフ・参加者）最新 N 件 */
export function getReposForEvent(eventId: string, limit = 3): Story[] {
  return getStoriesByEventId(eventId, {
    role: undefined,
    limit: limit + 10,
  }).filter((s) => s.role !== "organizer").slice(0, limit);
}

export function createStory(data: {
  title: string;
  lead: string;
  coverImageUrl: string;
  tags: string[];
  role: StoryRole;
  purpose: StoryPurpose;
  authorId: string;
  authorName: string;
  eventId: string | null;
  blocks: StoryBlock[];
  status?: StoryStatus;
}): Story {
  const id = `story-${nextId++}`;
  const slug = ensureUniqueSlug(slugFromTitle(data.title));
  const now = new Date().toISOString();
  const story: Story = {
    id,
    slug,
    title: data.title,
    lead: data.lead,
    coverImageUrl: data.coverImageUrl,
    tags: data.tags ?? [],
    role: data.role,
    purpose: data.purpose,
    status: data.status ?? "draft",
    isSeed: false,
    authorId: data.authorId,
    authorName: data.authorName,
    eventId: data.eventId ?? null,
    blocks: data.blocks ?? [],
    createdAt: now,
    updatedAt: now,
  };
  stories.push(story);
  return story;
}

export function updateStory(
  id: string,
  updates: Partial<Pick<Story, "title" | "lead" | "coverImageUrl" | "tags" | "blocks" | "status">>
): Story | null {
  const idx = stories.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const prev = stories[idx];
  const slug =
    updates.title !== undefined
      ? ensureUniqueSlug(slugFromTitle(updates.title), id)
      : prev.slug;
  stories[idx] = {
    ...prev,
    ...updates,
    slug: updates.title !== undefined ? slug : prev.slug,
    updatedAt: new Date().toISOString(),
  };
  return stories[idx];
}

export function publishStory(id: string): Story | null {
  return updateStory(id, { status: "published" });
}
