import { getCommunityPostAccess } from "@/lib/db/community-posts";
import { listLikedPostIds } from "@/lib/db/community-post-likes";
import { getApiUser } from "@/lib/api-auth";
import {
  applyLikedByMe,
  mapDbCommunityPostToView,
} from "@/lib/posts/map-community-post";
import type { CommunityPost } from "@/lib/posts/mock-feed";

/** 公開投稿詳細用。非公開アカウントと非公開投稿は、見られる人にだけ返す */
export async function getCommunityPostForPublicPage(
  id: string,
): Promise<CommunityPost | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const user = await getApiUser();
  const access = await getCommunityPostAccess(trimmed, user?.id ?? null);
  if (access.kind !== "ok") return null;
  const post = mapDbCommunityPostToView(access.post);
  if (!user) return post;
  const likedIds = await listLikedPostIds(user.id, [post.id]);
  return applyLikedByMe([post], likedIds)[0] ?? post;
}
