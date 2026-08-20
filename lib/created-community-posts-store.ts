/**
 * 開発用インメモリ投稿ストア（Supabase 未接続 / dev-user 時のフォールバック）
 */
import type { DbCommunityPost, CreateCommunityPostInput } from "@/lib/db/community-posts-types";

const memoryPosts: DbCommunityPost[] = [];

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function addMemoryCommunityPost(
  input: CreateCommunityPostInput,
): DbCommunityPost {
  const now = new Date().toISOString();
  const row: DbCommunityPost = {
    id: `mem-post-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    author_id: input.authorId && isUuid(input.authorId) ? input.authorId : null,
    author_display_name: input.authorDisplayName,
    category: input.category,
    title: input.title,
    body: input.body,
    area_label: input.areaLabel,
    media_type: input.mediaType ?? "video",
    media_url: input.mediaUrl,
    poster_url: input.posterUrl ?? null,
    duration_sec: input.durationSec ?? null,
    gallery_images: input.galleryImages ?? [],
    status: input.status ?? "public",
    like_count: 0,
    comment_count: 0,
    created_at: now,
    updated_at: now,
  };
  memoryPosts.unshift(row);
  return row;
}

export function listMemoryCommunityPosts(): DbCommunityPost[] {
  return [...memoryPosts];
}

export function listMemoryCommunityPostsByAuthor(
  authorId: string,
): DbCommunityPost[] {
  return memoryPosts.filter((p) => p.author_id === authorId);
}

export function getMemoryCommunityPostById(
  id: string,
): DbCommunityPost | null {
  return memoryPosts.find((p) => p.id === id) ?? null;
}

export type MemoryCommunityPostPatch = Partial<
  Pick<
    DbCommunityPost,
    | "category"
    | "title"
    | "body"
    | "area_label"
    | "status"
    | "media_type"
    | "media_url"
    | "poster_url"
    | "duration_sec"
    | "gallery_images"
  >
>;

/** 本人の投稿のみ更新する。存在しない/本人でない場合は null */
export function updateMemoryCommunityPost(
  id: string,
  authorId: string | null,
  patch: MemoryCommunityPostPatch,
): DbCommunityPost | null {
  const idx = memoryPosts.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const row = memoryPosts[idx];
  if (row.author_id && authorId && row.author_id !== authorId) return null;
  const next: DbCommunityPost = {
    ...row,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  memoryPosts[idx] = next;
  return next;
}

/** 本人の投稿のみ削除する。削除できたら true */
export function deleteMemoryCommunityPost(
  id: string,
  authorId: string | null,
): boolean {
  const idx = memoryPosts.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  const row = memoryPosts[idx];
  if (row.author_id && authorId && row.author_id !== authorId) return false;
  memoryPosts.splice(idx, 1);
  return true;
}
