import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adjustMemoryCommunityPostLikeCount } from "@/lib/created-community-posts-store";
import {
  memoryAddLike,
  memoryHasLike,
  memoryLikedPostIds,
  memoryLikedPostIdsForUser,
  memoryRemoveLike,
} from "@/lib/created-community-post-likes-store";
import {
  getCommunityPostAccess,
  getCommunityPostsByIds,
} from "@/lib/db/community-posts";
import { isAcceptedFollower } from "@/lib/db/user-follows";
import { canViewerSeePost } from "@/lib/posts/post-visibility";
import type { DbCommunityPost } from "@/lib/db/community-posts-types";
import { createNotification } from "@/lib/db/notifications";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function listLikedPostIds(
  userId: string,
  postIds: string[],
): Promise<Set<string>> {
  const liked = new Set<string>(memoryLikedPostIds(userId, postIds));
  const uuids = postIds.filter(isUuid);
  if (uuids.length === 0) return liked;

  const supabase = await createClient();
  if (!supabase) return liked;

  const { data, error } = await supabase
    .from("community_post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", uuids);
  if (error) {
    console.error("listLikedPostIds:", error.message);
    return liked;
  }
  for (const row of data ?? []) {
    liked.add(row.post_id as string);
  }
  return liked;
}

export async function listLikedPostIdsForUser(
  userId: string,
  limit = 80,
): Promise<string[]> {
  const memoryIds = memoryLikedPostIdsForUser(userId);
  const supabase = await createClient();
  if (!supabase || !isUuid(userId)) {
    return memoryIds.slice(0, limit);
  }

  const { data, error } = await supabase
    .from("community_post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("listLikedPostIdsForUser:", error.message);
    return memoryIds.slice(0, limit);
  }

  const ids: string[] = [];
  const seen = new Set<string>();
  for (const row of data ?? []) {
    const id = row.post_id as string;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  for (const id of memoryIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids.slice(0, limit);
}

export async function listVisibleLikedCommunityPosts(
  viewerId: string,
): Promise<DbCommunityPost[]> {
  const ids = await listLikedPostIdsForUser(viewerId);
  if (ids.length === 0) return [];

  const posts = await getCommunityPostsByIds(ids);
  const byId = new Map(posts.map((p) => [p.id, p]));

  const hiddenAuthors = new Set<string>();
  for (const post of posts) {
    if (
      post.status === "hidden" &&
      post.author_id &&
      post.author_id !== viewerId
    ) {
      hiddenAuthors.add(post.author_id);
    }
  }
  const followerByAuthor = new Map<string, boolean>();
  await Promise.all(
    [...hiddenAuthors].map(async (authorId) => {
      followerByAuthor.set(
        authorId,
        await isAcceptedFollower(viewerId, authorId),
      );
    }),
  );

  const ordered: DbCommunityPost[] = [];
  for (const id of ids) {
    const post = byId.get(id);
    if (!post) continue;
    const follower =
      post.author_id === viewerId ||
      Boolean(post.author_id && followerByAuthor.get(post.author_id));
    if (canViewerSeePost(post, viewerId, follower)) ordered.push(post);
  }
  return ordered;
}

export async function setCommunityPostLike(
  postId: string,
  userId: string,
  userName: string,
  liked: boolean,
): Promise<{ liked: boolean; likeCount: number } | { error: string; status: number }> {
  const access = await getCommunityPostAccess(postId, userId);
  if (access.kind !== "ok") {
    return { error: "投稿が見つかりません", status: 404 };
  }
  const post = access.post;

  if (!isUuid(postId)) {
    const had = memoryHasLike(userId, postId);
    if (liked) memoryAddLike(userId, postId);
    else memoryRemoveLike(userId, postId);
    const nowHas = memoryHasLike(userId, postId);
    let nextCount = post.like_count;
    if (!had && nowHas) nextCount += 1;
    if (had && !nowHas) nextCount = Math.max(0, nextCount - 1);
    const updated = adjustMemoryCommunityPostLikeCount(postId, nextCount);
    return {
      liked: nowHas,
      likeCount: updated?.like_count ?? nextCount,
    };
  }

  const supabase = await createClient();
  const admin = createAdminClient();
  const writer = admin ?? supabase;
  if (!writer) {
    if (liked) memoryAddLike(userId, postId);
    else memoryRemoveLike(userId, postId);
    const nextCount = Math.max(0, post.like_count + (liked ? 1 : -1));
    return { liked, likeCount: nextCount };
  }

  if (liked) {
    const { error } = await writer.from("community_post_likes").insert({
      post_id: postId,
      user_id: userId,
    });
    if (error && error.code !== "23505" && !/duplicate|unique/i.test(error.message)) {
      console.error("setCommunityPostLike insert:", error.message);
      return { error: "いいねに失敗しました", status: 500 };
    }
    const inserted = !error;
    const likeCount = await syncLikeCount(writer, postId, post.like_count);
    if (
      inserted &&
      post.author_id &&
      post.author_id !== userId &&
      supabase
    ) {
      const shortTitle =
        post.title.length > 32 ? `${post.title.slice(0, 32)}…` : post.title;
      await createNotification(
        supabase,
        post.author_id,
        "post_like",
        `${userName}さんが「${shortTitle}」にいいねしました`,
        {
          body: "みんなの投稿から確認できます。",
          link: `/posts/${postId}`,
        },
      );
    }
    return { liked: true, likeCount };
  }

  await writer
    .from("community_post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);
  const likeCount = await syncLikeCount(writer, postId, post.like_count);
  return { liked: false, likeCount };
}

async function syncLikeCount(
  client: SupabaseClient,
  postId: string,
  fallback: number,
): Promise<number> {
  const { count, error } = await client
    .from("community_post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  const next = error ? fallback : (count ?? 0);
  const { error: updateError } = await client
    .from("community_posts")
    .update({ like_count: next, updated_at: new Date().toISOString() })
    .eq("id", postId);
  if (updateError) {
    console.error("syncLikeCount:", updateError.message);
  }
  adjustMemoryCommunityPostLikeCount(postId, next);
  return next;
}
