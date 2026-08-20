import { getPublicCommunityPostById } from "@/lib/db/community-posts";
import { mapDbCommunityPostToView } from "@/lib/posts/map-community-post";
import { findDemoCommunityPost } from "@/lib/posts/my-posts-demo";
import {
  MOCK_COMMUNITY_POSTS,
  type CommunityPost,
} from "@/lib/posts/mock-feed";

/** 公開投稿詳細用。DB → メモリ → モック → マイアルバムのデモ の順で解決 */
export async function getCommunityPostForPublicPage(
  id: string,
): Promise<CommunityPost | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const row = await getPublicCommunityPostById(trimmed);
  if (row) return mapDbCommunityPostToView(row);

  const mock = MOCK_COMMUNITY_POSTS.find((p) => p.id === trimmed);
  if (mock) return mock;

  return findDemoCommunityPost(trimmed);
}
