import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addMemoryPostComment,
  listMemoryPostComments,
} from "@/lib/created-community-post-comments-store";
import type {
  CreateCommunityPostCommentInput,
  DbCommunityPostComment,
} from "@/lib/db/community-post-comments-types";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeAuthorId(authorId: string | null): string | null {
  if (!authorId) return null;
  return isUuid(authorId) ? authorId : null;
}

/** 投稿のコメント一覧（新しい順）。DB + メモリをマージ */
export async function listCommentsByPostId(
  postId: string,
): Promise<DbCommunityPostComment[]> {
  const memory = listMemoryPostComments(postId);

  // モック / デモ投稿（uuid 以外）は DB に存在しない
  if (!isUuid(postId)) {
    return sortByCreatedDesc(memory);
  }

  const supabase = await createClient();
  if (!supabase) {
    return sortByCreatedDesc(memory);
  }

  const { data, error } = await supabase
    .from("community_post_comments")
    .select("*")
    .eq("post_id", postId)
    .eq("status", "public")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listCommentsByPostId:", error.message);
    return sortByCreatedDesc(memory);
  }

  const dbRows = (data ?? []) as DbCommunityPostComment[];
  return sortByCreatedDesc(mergeComments(dbRows, memory));
}

export async function createPostComment(
  input: CreateCommunityPostCommentInput,
): Promise<DbCommunityPostComment> {
  // モック / デモ投稿にはメモリへ保存（DB に外部キーが無いため）
  if (!isUuid(input.postId)) {
    return addMemoryPostComment(input);
  }

  const payload = {
    post_id: input.postId,
    author_id: normalizeAuthorId(input.authorId),
    author_display_name: input.authorDisplayName,
    body: input.body,
    status: "public" as const,
  };

  const supabase = await createClient();
  const admin = createAdminClient();
  const writer = admin ?? supabase;

  if (writer) {
    const { data, error } = await writer
      .from("community_post_comments")
      .insert(payload)
      .select("*")
      .single();

    if (!error && data) {
      return data as DbCommunityPostComment;
    }
    if (error) {
      console.error("createPostComment:", error.message);
    }
  }

  return addMemoryPostComment(input);
}

function mergeComments(
  dbRows: DbCommunityPostComment[],
  memoryRows: DbCommunityPostComment[],
): DbCommunityPostComment[] {
  const seen = new Set<string>();
  const out: DbCommunityPostComment[] = [];
  for (const row of [...memoryRows, ...dbRows]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

function sortByCreatedDesc(
  rows: DbCommunityPostComment[],
): DbCommunityPostComment[] {
  return [...rows].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}
