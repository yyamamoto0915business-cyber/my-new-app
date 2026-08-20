import { getPublicCommunityPostById } from "@/lib/db/community-posts";
import { mapDbCommunityPostToView } from "@/lib/posts/map-community-post";
import type { CommunityPost } from "@/lib/posts/mock-feed";

/** 公開投稿詳細用。DB の実投稿のみ返す（モック／デモにはフォールバックしない） */
export async function getCommunityPostForPublicPage(
  id: string,
): Promise<CommunityPost | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const row = await getPublicCommunityPostById(trimmed);
  if (row) return mapDbCommunityPostToView(row);

  return null;
}
