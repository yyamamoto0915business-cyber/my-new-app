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
import { isAcceptedFollower } from "@/lib/db/user-follows";
import {
  canViewerSeePost,
  type PostAccess,
} from "@/lib/posts/post-visibility";
import { withAuthorAvatar, withAuthorAvatars } from "@/lib/posts/author-avatars";
import {
  fetchRelatedLinkPreview,
  normalizeRelatedUrl,
} from "@/lib/posts/link-preview";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeAuthorId(authorId: string | null): string | null {
  if (!authorId) return null;
  return isUuid(authorId) ? authorId : null;
}

/** related_* 未マイグレーション時のフォールバック用 */
const COMMUNITY_POST_SELECT_CORE =
  "id, author_id, author_display_name, category, title, body, area_label, media_type, media_url, poster_url, duration_sec, gallery_images, status, like_count, comment_count, created_at, updated_at";

function withRelatedLinkDefaults(row: DbCommunityPost): DbCommunityPost {
  return {
    ...row,
    related_url: row.related_url ?? "",
    related_title: row.related_title ?? "",
    related_image_url: row.related_image_url ?? "",
    related_site_name: row.related_site_name ?? "",
  };
}

export async function listPublicCommunityPosts(options?: {
  category?: PostCategory | "all";
  limit?: number;
}): Promise<DbCommunityPost[]> {
  const limit = options?.limit ?? 50;
  const memory = listMemoryCommunityPosts();
  const supabase = await createClient();

  if (!supabase) {
    return withAuthorAvatars(
      filterByCategory(memory, options?.category).slice(0, limit),
    );
  }

  const category =
    options?.category && options.category !== "all" ? options.category : null;

  const run = (select: string) => {
    let query = supabase
      .from("community_posts")
      .select(select)
      .eq("status", "public")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (category) query = query.eq("category", category);
    return query;
  };

  let { data, error } = await run("*");
  if (error) {
    console.error("listPublicCommunityPosts:", error.message);
    const fallback = await run(COMMUNITY_POST_SELECT_CORE);
    data = fallback.data;
    error = fallback.error;
    if (error) {
      console.error("listPublicCommunityPosts fallback:", error.message);
      return withAuthorAvatars(
        filterByCategory(memory, options?.category).slice(0, limit),
      );
    }
  }

  const dbRows = ((data ?? []) as unknown as DbCommunityPost[]).map(
    withRelatedLinkDefaults,
  );
  const merged = mergePosts(dbRows, memory);
  return withAuthorAvatars(
    filterByCategory(merged, options?.category).slice(0, limit),
  );
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

/** 作者のアルバム用。下書きは本人のみ、非公開は本人と承認フォロワー */
export async function listAuthorAlbumPosts(
  authorId: string,
  viewerId: string | null,
  options?: { limit?: number },
): Promise<DbCommunityPost[]> {
  const limit = options?.limit ?? 60;
  const isOwner = Boolean(viewerId && viewerId === authorId);
  const follower = isOwner
    ? true
    : await isAcceptedFollower(viewerId, authorId);
  const rows = await listMyCommunityPosts(authorId, { limit });
  return rows.filter((post) => {
    if (post.status === "draft") return isOwner;
    return canViewerSeePost(post, viewerId, follower);
  });
}

export async function getCommunityPostAccess(
  id: string,
  viewerId: string | null,
): Promise<PostAccess> {
  const memory = getMemoryCommunityPostById(id);
  let row: DbCommunityPost | null = memory;

  if (!row && isUuid(id)) {
    const supabase = await createClient();
    const admin = createAdminClient();
    const reader = admin ?? supabase;
    if (reader) {
      const { data, error } = await reader
        .from("community_posts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        console.error("getCommunityPostAccess:", error.message);
      } else {
        row = (data as DbCommunityPost | null) ?? null;
      }
    }
  }

  if (!row) return { kind: "missing" };

  const isOwner = Boolean(viewerId && row.author_id === viewerId);
  if (row.status === "draft" && !isOwner) return { kind: "missing" };

  const follower = isOwner
    ? true
    : await isAcceptedFollower(viewerId, row.author_id);
  if (canViewerSeePost(row, viewerId, follower)) {
    return { kind: "ok", post: await withAuthorAvatar(row) };
  }
  if (row.status === "hidden") {
    return { kind: "private", authorId: row.author_id };
  }
  return { kind: "missing" };
}

export async function getCommunityPostsByIds(
  ids: string[],
): Promise<DbCommunityPost[]> {
  if (ids.length === 0) return [];

  const memoryHits = ids
    .map((id) => getMemoryCommunityPostById(id))
    .filter((row): row is DbCommunityPost => row != null);

  const uuids = ids.filter(isUuid);
  const supabase = await createClient();
  let dbRows: DbCommunityPost[] = [];
  if (supabase && uuids.length > 0) {
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .in("id", uuids);
    if (error) {
      console.error("getCommunityPostsByIds:", error.message);
    } else {
      dbRows = (data ?? []) as DbCommunityPost[];
    }
  }

  const byId = new Map<string, DbCommunityPost>();
  for (const row of dbRows) byId.set(row.id, row);
  for (const row of memoryHits) byId.set(row.id, row);

  const ordered = ids
    .map((id) => byId.get(id))
    .filter((row): row is DbCommunityPost => row != null);
  return await withAuthorAvatars(ordered);
}

export async function getPublicCommunityPostById(
  id: string,
): Promise<DbCommunityPost | null> {
  const memory = getMemoryCommunityPostById(id);
  if (memory && memory.status === "public") {
    return withAuthorAvatar(memory);
  }

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
  const row = (data as DbCommunityPost | null) ?? null;
  return row ? withAuthorAvatar(row) : null;
}

export async function createCommunityPost(
  input: CreateCommunityPostInput,
): Promise<DbCommunityPost> {
  const authorId = normalizeAuthorId(input.authorId);
  const related = await resolveRelatedLinkFields(input.relatedUrl);
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
    related_url: related.related_url,
    related_title: related.related_title,
    related_image_url: related.related_image_url,
    related_site_name: related.related_site_name,
  };

  const supabase = await createClient();
  const admin = createAdminClient();
  const writer = admin ?? supabase;

  if (!writer) {
    return withAuthorAvatar(
      addMemoryCommunityPost({
        ...input,
        relatedUrl: related.related_url,
        relatedTitle: related.related_title,
        relatedImageUrl: related.related_image_url,
        relatedSiteName: related.related_site_name,
      }),
    );
  }

  const { data, error } = await writer
    .from("community_posts")
    .insert(payload)
    .select("*")
    .single();

  if (!error && data) {
    return withAuthorAvatar(data as DbCommunityPost);
  }

  console.error("createCommunityPost:", error?.message ?? "unknown insert error");
  throw new Error("投稿の保存に失敗しました");
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
    let nextPatch: UpdateCommunityPostPatch = patch;
    if (patch.related_url !== undefined) {
      const related = await resolveRelatedLinkFields(patch.related_url);
      nextPatch = { ...patch, ...related };
    }
    return updateMemoryCommunityPost(id, authorId, nextPatch);
  }

  if (!isUuid(id)) return null;

  const supabase = await createClient();
  const admin = createAdminClient();
  const writer = admin ?? supabase;
  if (!writer) return null;

  let nextPatch: UpdateCommunityPostPatch = { ...patch };
  if (patch.related_url !== undefined) {
    const related = await resolveRelatedLinkFields(patch.related_url);
    nextPatch = { ...patch, ...related };
  }

  const { data, error } = await writer
    .from("community_posts")
    .update({ ...nextPatch, updated_at: new Date().toISOString() })
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

async function resolveRelatedLinkFields(rawUrl: string | undefined): Promise<{
  related_url: string;
  related_title: string;
  related_image_url: string;
  related_site_name: string;
}> {
  const url = normalizeRelatedUrl(rawUrl ?? "");
  if (!url) {
    return {
      related_url: "",
      related_title: "",
      related_image_url: "",
      related_site_name: "",
    };
  }
  const preview = await fetchRelatedLinkPreview(url);
  return {
    related_url: preview?.url ?? url,
    related_title: preview?.title ?? "",
    related_image_url: preview?.imageUrl ?? "",
    related_site_name: preview?.siteName ?? "",
  };
}
