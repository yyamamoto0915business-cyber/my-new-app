import { getPublicCommunityPostById } from "@/lib/db/community-posts";
import { listLikedPostIds } from "@/lib/db/community-post-likes";
import { getApiUser } from "@/lib/api-auth";
import {
  applyLikedByMe,
  mapDbCommunityPostToView,
} from "@/lib/posts/map-community-post";
import type { CommunityPost } from "@/lib/posts/mock-feed";

/** 公開投稿詳細用。DB の実投稿のみ返す（モック／デモにはフォールバックしない） */
export async function getCommunityPostForPublicPage(
  id: string,
): Promise<CommunityPost | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const row = await getPublicCommunityPostById(trimmed);
  if (!row) return null;
  const post = mapDbCommunityPostToView(row);
  const user = await getApiUser();
  if (!user) return post;
  const likedIds = await listLikedPostIds(user.id, [post.id]);
  return applyLikedByMe([post], likedIds)[0] ?? post;
}
