/**
 * 開発用インメモリ コメントストア
 * （Supabase 未接続 / モック・デモ投稿へのコメント時のフォールバック）
 */
import type {
  CreateCommunityPostCommentInput,
  DbCommunityPostComment,
} from "@/lib/db/community-post-comments-types";

const memoryComments: DbCommunityPostComment[] = [];

export function addMemoryPostComment(
  input: CreateCommunityPostCommentInput,
): DbCommunityPostComment {
  const now = new Date().toISOString();
  const row: DbCommunityPostComment = {
    id: `mem-comment-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    post_id: input.postId,
    author_id: input.authorId,
    author_display_name: input.authorDisplayName,
    body: input.body,
    like_count: 0,
    status: "public",
    created_at: now,
    updated_at: now,
  };
  memoryComments.unshift(row);
  return row;
}

export function listMemoryPostComments(
  postId: string,
): DbCommunityPostComment[] {
  return memoryComments.filter((c) => c.post_id === postId);
}
