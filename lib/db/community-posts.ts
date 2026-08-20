import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addMemoryCommunityPost,
  deleteMemoryCommunityPost,
  getMemoryCommunityPostById,
  listMemoryCommunityPosts,
  listMemoryCommunityPostsByAuthor,
  updateMemoryCommunityPost,
  type MemoryCommunityPostPatch,
} from "@/lib/created-community-posts-store";
import type {
  CreateCommunityPostInput,
  DbCommunityPost,
} from "@/lib/db/community-posts-types";
import type { PostCategory } from "@/lib/posts/mock-feed";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeAuthorId(authorId: string | null): string | null {
  if (!authorId) return null;
  return isUuid(authorId) ? authorId : null;
}

export async function listPublicCommunityPosts(options?: {
  category?: PostCategory | "all";
  limit?: number;
}): Promise<DbCommunityPost[]> {
  const limit = options?.limit ?? 50;
  const memory = listMemoryCommunityPosts();
  const supabase = await createClient();

  if (!supabase) {
    return filterByCategory(memory, options?.category).slice(0, limit);
  }

  let query = supabase
    .from("community_posts")
    .select("*")
    .eq("status", "public")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.category && options.category !== "all") {
    query = query.eq("category", options.category);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listPublicCommunityPosts:", error.message);
    return filterByCategory(memory, options?.category).slice(0, limit);
  }

  const dbRows = (data ?? []) as DbCommunityPost[];
  const merged = mergePosts(dbRows, memory);
  return filterByCategory(merged, options?.category).slice(0, limit);
}

/** 自分の投稿一覧（マイページ・実績用） */
export async function listMyCommunityPosts(
  authorId: string,
  options?: { limit?: number },
): Promise<DbCommunityPost[]> {
  const limit = options?.limit ?? 20;
  const memory = listMemoryCommunityPostsByAuthor(authorId);
  const supabase = await createClient();

  if (!supabase) {
    return memory.slice(0, limit);
  }

  // 本人の一覧なので下書き・非公開も含めて返す（アルバム上で管理できるように）
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listMyCommunityPosts:", error.message);
    return memory.slice(0, limit);
  }

  const dbRows = (data ?? []) as DbCommunityPost[];
  const merged = mergePosts(dbRows, memory);
  return merged.slice(0, limit);
}

export async function getPublicCommunityPostById(
  id: string,
): Promise<DbCommunityPost | null> {
  const memory = getMemoryCommunityPostById(id);
  if (memory && memory.status === "public") return memory;

  // community_posts.id は uuid 型。デモ/モックの ID をそのまま渡すと DB エラーになる。
  if (!isUuid(id)) return null;

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("id", id)
    .eq("status", "public")
    .maybeSingle();

  if (error) {
    console.error("getPublicCommunityPostById:", error.message);
    return null;
  }
  return (data as DbCommunityPost | null) ?? null;
}

export async function createCommunityPost(
  input: CreateCommunityPostInput,
): Promise<DbCommunityPost> {
  const authorId = normalizeAuthorId(input.authorId);
  const payload = {
    author_id: authorId,
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
    status: input.status ?? ("public" as const),
  };

  const supabase = await createClient();
  const admin = createAdminClient();
  const writer = admin ?? supabase;

  if (writer) {
    const { data, error } = await writer
      .from("community_posts")
      .insert(payload)
      .select("*")
      .single();

    if (!error && data) {
      return data as DbCommunityPost;
    }
    if (error) {
      console.error("createCommunityPost:", error.message);
    }
  }

  return addMemoryCommunityPost(input);
}

/** 本人の投稿を状態問わず1件取得（編集画面用） */
export async function getMyCommunityPostById(
  id: string,
  authorId: string,
): Promise<DbCommunityPost | null> {
  const memory = getMemoryCommunityPostById(id);
  if (memory) {
    if (memory.author_id && memory.author_id !== authorId) return null;
    return memory;
  }

  if (!isUuid(id)) return null;

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("id", id)
    .eq("author_id", authorId)
    .maybeSingle();

  if (error) {
    console.error("getMyCommunityPostById:", error.message);
    return null;
  }
  return (data as DbCommunityPost | null) ?? null;
}

export type UpdateCommunityPostPatch = MemoryCommunityPostPatch;

/** 本人の投稿を更新（公開状態や本文など）。本人でない/存在しない場合は null */
export async function updateCommunityPost(
  id: string,
  authorId: string,
  patch: UpdateCommunityPostPatch,
): Promise<DbCommunityPost | null> {
  if (Object.keys(patch).length === 0) {
    return getMyCommunityPostById(id, authorId);
  }

  const memory = getMemoryCommunityPostById(id);
  if (memory) {
    return updateMemoryCommunityPost(id, authorId, patch);
  }

  if (!isUuid(id)) return null;

  const supabase = await createClient();
  const admin = createAdminClient();
  const writer = admin ?? supabase;
  if (!writer) return null;

  const { data, error } = await writer
    .from("community_posts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("author_id", authorId)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("updateCommunityPost:", error.message);
    return null;
  }
  return (data as DbCommunityPost | null) ?? null;
}

/** 本人の投稿を削除。削除できたら true */
export async function deleteCommunityPost(
  id: string,
  authorId: string,
): Promise<boolean> {
  const memory = getMemoryCommunityPostById(id);
  if (memory) {
    return deleteMemoryCommunityPost(id, authorId);
  }

  if (!isUuid(id)) return false;

  const supabase = await createClient();
  const admin = createAdminClient();
  const writer = admin ?? supabase;
  if (!writer) return false;

  const { data, error } = await writer
    .from("community_posts")
    .delete()
    .eq("id", id)
    .eq("author_id", authorId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("deleteCommunityPost:", error.message);
    return false;
  }
  return Boolean(data);
}

function mergePosts(
  dbRows: DbCommunityPost[],
  memoryRows: DbCommunityPost[],
): DbCommunityPost[] {
  const seen = new Set<string>();
  const out: DbCommunityPost[] = [];
  for (const row of [...memoryRows, ...dbRows]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  out.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return out;
}

function filterByCategory(
  rows: DbCommunityPost[],
  category?: PostCategory | "all",
): DbCommunityPost[] {
  if (!category || category === "all") return rows;
  return rows.filter((r) => r.category === category);
}
